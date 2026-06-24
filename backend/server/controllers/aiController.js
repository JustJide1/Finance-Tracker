const Transaction = require("../models/Transaction");
const User = require("../models/user");
const Insight = require("../models/Insight");
const InsightHistory = require("../models/InsightHistory");
const CategoryCorrection = require("../models/CategoryCorrection");
const BudgetSuggestion = require("../models/BudgetSuggestion");
const { generate, QUEUE_FULL_MSG, QUOTA_EXCEEDED_MSG } = require("../utils/geminiLimiter");
const { getRecentCorrections } = require("../utils/correctionCache");
const { getCachedCategory, setCachedCategory } = require("../utils/categorizationCache");
const { parseNaturalLanguage } = require("../services/aiService");
const { getCategorySpendingSummary, getRuleBasedBudgetSuggestions, getAIBudgetSuggestions } = require("../services/budgetSuggestionService");

// Returns true when the error means the AI system is temporarily overloaded —
// callers should respond with 503 + Retry-After rather than a generic 500.
function isOverloadError(err) {
    return (
        err?.isLimiterError ||
        err?.isTimeout ||
        err?.message === QUEUE_FULL_MSG ||
        err?.message === QUOTA_EXCEEDED_MSG ||
        err?.isQuotaError
    );
}



// Test Gemini connection
exports.testGemini = async (req, res) => {
    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY not found in environment" });
    }

    try {
        const result = await generate("Say hello");
        const response = result.response.text();
        res.json({ success: true, response });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// List available Gemini models via REST API
exports.listModels = async (req, res) => {
    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY not found in environment" });
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
        );
        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({ error: data.error?.message || "Failed to fetch models" });
        }

        const modelNames = data.models.map(m => m.name);
        res.json({
            success: true,
            availableModels: modelNames,
            count: modelNames.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Parse natural language transaction
exports.parseTransaction = async (req, res) => {
    const { text } = req.body;

    if (!text || text.trim().length < 10) {
        return res.status(400).json({
            message: "Description too short — please describe the transaction in a few words"
        });
    }

    try {
        const parsed = await parseNaturalLanguage(text);
        res.json(parsed);
    } catch (err) {
        res.status(500).json({ message: "Failed to parse transaction" });
    }
};


// Rule-based fallback when Gemini quota is exceeded or fails
const categorizeByRules = (description) => {
    const desc = description.toLowerCase();

    if (/uber|bolt|taxi|bus|transport|fuel|petrol|keke|okada|train/.test(desc))
        return "Transportation";
    if (/shoprite|spar|market|grocery|food|eat|restaurant|suya|chicken|rice|bread|lunch|dinner|breakfast/.test(desc))
        return "Food & Dining";
    if (/netflix|spotify|cinema|movie|game|dstv|gotv|showmax|entertainment/.test(desc))
        return "Entertainment";
    if (/nepa|phcn|electricity|water|internet|wifi|mtn|airtel|glo|9mobile|bill/.test(desc))
        return "Bills & Utilities";
    if (/hospital|pharmacy|doctor|clinic|health|drug|medicine/.test(desc))
        return "Healthcare";
    if (/school|tuition|course|book|education|training/.test(desc))
        return "Education";
    if (/salary|wages|payment|income|freelance|contract/.test(desc))
        return "Salary";
    if (/\bsav(e|ed|ing|ings)\b|piggybank|emergency fund|target savings/.test(desc))
        return "Savings";
    if (/invest|stock|crypto|mutual fund|shares|bonds/.test(desc))
        return "Investment";
    if (/amazon|jumia|konga|shopping|clothes|fashion|shoe/.test(desc))
        return "Shopping";
    if (/mum|mom|dad|father|mother|parent|sibling|brother|sister|family|sent to|send to|support/.test(desc))
        return "Family Support";
    if (/salon|barber|haircut|spa|grooming|skincare|beauty|personal care|cosmetics|manicure|pedicure|barbing/.test(desc))
        return "Personal Care";
    if (/\bowe(d|s)?\b|\bdebt\b|\blend\b|\blent\b|\bborrow(ed)?\b|paid .+ for|transfer to|refund to/.test(desc))
        return "Personal Transfer";
    if (/\breceiv(ed|e)\b|\bcredit(ed)?\b|\bdeposit(ed)?\b|payment received|money received|cash received/.test(desc))
        return "Income";

    return "Other";
};

// Auto-categorize a transaction, optionally using recent user corrections as few-shot examples
exports.categorizeTransaction = async (description, recentCorrections = []) => {
    // Cache hit only when there are no user-specific corrections (result is user-neutral)
    if (recentCorrections.length === 0) {
        const cached = getCachedCategory(description);
        if (cached) return cached;
    }

    let fewShotSection = "";
    if (recentCorrections.length > 0) {
        const examples = recentCorrections
            .map(c => `- "${c.description}" → ${c.correctedCategory} (not ${c.originalCategory})`)
            .join("\n");
        fewShotSection = `\nLearn from these recent corrections this user made — apply the same logic:\n${examples}\n`;
    }

    const prompt = `You are a financial assistant. Categorize this transaction into ONE of these categories:
- Food & Dining
- Transportation
- Shopping
- Entertainment
- Bills & Utilities
- Healthcare
- Education
- Investment (stocks, crypto, mutual funds, shares, bonds — money put to work for returns)
- Savings (money set aside in savings account, piggybank, emergency fund — NOT investment)
- Income (money received with no clear indication of its source — generic deposits, unspecified transfers received)
- Personal Transfer (paying someone back, or being repaid by a NAMED person for a specific debt — owe, owed, lent, borrowed, refund to/from a named person)
- Salary
- Business
- Gifts
- Family Support
- Personal Care
- Other
${fewShotSection}
Transaction description: "${description}"

If money was received but the description gives no clear indication of where it came from, respond with Income, NOT Personal Transfer.

Respond with ONLY the category name, nothing else.`;

    try {
        const result = await generate(prompt);
        const category = result.response.text().trim();
        console.log("✅ Gemini categorized:", description, "→", category);
        if (recentCorrections.length === 0) setCachedCategory(description, category);
        return category;
    } catch (error) {
        if (error.message && error.message.includes("429")) {
            console.warn("⚠️ Gemini quota exceeded, using rule-based fallback");
            return categorizeByRules(description);
        }
        console.error("❌ Gemini categorization error:", error.message);
        return categorizeByRules(description);
    }
};

// Generate spending insights
exports.generateInsights = async (currentTransactions, previousTransactions, period) => {
    const currentExpenses = currentTransactions.filter(t => t.type === "expense");
    const previousExpenses = previousTransactions ? previousTransactions.filter(t => t.type === "expense") : [];

    if (currentExpenses.length === 0) {
        return ["No expenses yet for this period. Start tracking to get insights!"];
    }

    const currentTotal = currentExpenses.reduce((sum, t) => sum + t.amount, 0);
    const previousTotal = previousExpenses.reduce((sum, t) => sum + t.amount, 0);

    const currentCategoryBreakdown = {};
    currentExpenses.forEach(t => {
        currentCategoryBreakdown[t.category] = (currentCategoryBreakdown[t.category] || 0) + t.amount;
    });

    const topCategory = Object.entries(currentCategoryBreakdown)
        .sort((a, b) => b[1] - a[1])[0];

    let comparisonText = "";
    if (period !== 'all' && previousExpenses.length > 0) {
        const diff = currentTotal - previousTotal;
        const percentChange = ((diff / previousTotal) * 100).toFixed(1);
        const direction = diff > 0 ? "increased" : "decreased";
        comparisonText = `Previous ${period} total spent: ₦${previousTotal.toLocaleString()}. Spending has ${direction} by ${Math.abs(percentChange)}% compared to the previous ${period}.`;
    }

    const summary = `
Period: ${period}
Current total spent: ₦${currentTotal.toLocaleString()}
${comparisonText}
Number of current transactions: ${currentExpenses.length}
Top spending category: ${topCategory ? `${topCategory[0]} (₦${topCategory[1].toLocaleString()})` : "None"}
Current categories: ${JSON.stringify(currentCategoryBreakdown)}
`;

    const prompt = `You are a Nigerian financial advisor reviewing a student's spending. Give 3 specific, data-driven insights.

${summary}

Rules:
- Reference actual numbers from the data (amounts, percentages, category names)
- Each insight must mention a specific action the user can take
- Use Nigerian context (₦, mention common expenses like airtime, transport, data)
- NO generic advice like "keep tracking your expenses"

Format: JSON array of exactly 3 strings.
Example: ["You spent ₦12,400 on Food this month — that's 45% of total. Try cooking at home 3x/week to cut this by ₦3,000", "Your Transport spend of ₦8,200 is up 30% — consider a weekly bus pass to save ₦2,000", "Airtime/Data at ₦3,500 this month: switching to a monthly bundle plan could save you ₦1,000"]

Respond with ONLY the JSON array.`;

    try {
        const result = await generate(prompt);
        let response = result.response.text().trim();

        response = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

        const insights = JSON.parse(response);
        return Array.isArray(insights) ? insights.slice(0, 3) : ["Keep tracking your expenses to get insights!"];
    } catch (error) {
        if (error.isQuotaError || error.message === "ALL_QUOTA_EXCEEDED") {
            console.warn("⚠️ All Gemini models quota exceeded. Returning rule-based insights.");
        } else {
            console.error("Gemini insights error:", error);
        }
        return [
            `You've made ${currentExpenses.length} expense transaction(s) this ${period}.`,
            topCategory
                ? `Your top spending category is ${topCategory[0]} (₦${topCategory[1].toLocaleString()}).`
                : "Start tracking expenses to see your top category.",
            "AI insights are temporarily unavailable. Your quota resets daily — check back tomorrow."
        ];
    }
};

// Detect anomalies
// Uses a 90-day rolling window, per-category baselines, and persists flagged IDs
// so the same transactions never trigger the banner twice.
exports.detectAnomalies = async (transactions, userId) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);

    const recentExpenses = transactions.filter(
        t => t.type === "expense" && new Date(t.date) >= cutoff
    );

    if (recentExpenses.length < 5) return null;

    // Group by category and compute per-category mean
    const byCategory = {};
    for (const t of recentExpenses) {
        const cat = t.category || "Other";
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(t);
    }

    // Load IDs already flagged for this user so we don't re-alert them
    const userDoc = userId
        ? await User.findById(userId).select("flaggedAnomalyIds").lean()
        : null;
    const alreadyFlagged = new Set((userDoc?.flaggedAnomalyIds || []).map(String));

    const newAnomalies = [];
    for (const [cat, txns] of Object.entries(byCategory)) {
        if (txns.length < 2) continue; // need at least 2 to establish a baseline
        const mean = txns.reduce((sum, t) => sum + t.amount, 0) / txns.length;
        const threshold = mean * 2;
        for (const t of txns) {
            const id = String(t._id);
            if (t.amount > threshold && !alreadyFlagged.has(id)) {
                newAnomalies.push({ ...t, _categoryMean: mean });
            }
        }
    }

    if (newAnomalies.length === 0) return null;

    // Persist the new IDs so they won't fire again
    if (userId) {
        const newIds = newAnomalies.map(t => String(t._id));
        await User.updateOne(
            { _id: userId },
            { $addToSet: { flaggedAnomalyIds: { $each: newIds } } }
        );
    }

    const overallMean = recentExpenses.reduce((sum, t) => sum + t.amount, 0) / recentExpenses.length;
    const prompt = `A user made these unusually large purchases (average spending: ₦${overallMean.toFixed(0)}):

${newAnomalies.map(a => `- ₦${a.amount.toLocaleString()} on ${a.category}: ${a.description} (category avg: ₦${a._categoryMean.toFixed(0)})`).join("\n")}

Write ONE informational alert (max 20 words) noting these purchases were above average.
Do NOT ask the user to reply or confirm. State it as information only.
Example: "Heads up: Your ₦5,000 MTN Airtime and ₦4,500 transfer were above your usual spending."

Respond with ONLY the alert text, no quotes or formatting.`;

    try {
        const result = await generate(prompt);
        return result.response.text().trim();
    } catch (error) {
        console.error("Gemini anomaly detection error:", error);
        return null;
    }
};

// ── HTTP Route Handlers ──────────────────────────────────────────────────────

// POST /api/ai/categorize
exports.suggestCategory = async (req, res) => {
    const { description } = req.body;
    if (!description) {
        return res.status(400).json({ message: "Description is required" });
    }
    try {
        const recentCorrections = await getRecentCorrections(req.user.id);
        const category = await exports.categorizeTransaction(description, recentCorrections);
        res.json({ category });
    } catch (err) {
        res.status(500).json({ message: "Failed to categorize" });
    }
};

const INSIGHT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// GET /api/ai/insights
exports.getInsights = async (req, res) => {
    try {
        const userId = req.user.id;
        const period = req.query.period || 'month';

        const existing = await Insight.findOne({ userId, period });
        if (existing && Date.now() - existing.generatedAt.getTime() < INSIGHT_TTL_MS) {
            return res.json({ insights: existing.insights, cached: true });
        }

        const now = new Date();
        let currentStart, previousStart, previousEnd;
        
        if (period === 'week') {
            const day = now.getDay() || 7; // 1-7 (Mon-Sun)
            currentStart = new Date(now);
            currentStart.setHours(0,0,0,0);
            currentStart.setDate(now.getDate() - day + 1); // Start of this week (Monday)
            
            previousEnd = new Date(currentStart);
            previousEnd.setMilliseconds(-1); // End of last week
            previousStart = new Date(previousEnd);
            previousStart.setDate(previousStart.getDate() - 6);
            previousStart.setHours(0,0,0,0); // Start of last week
        } else if (period === 'month') {
            currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
            previousEnd = new Date(currentStart);
            previousEnd.setMilliseconds(-1);
            previousStart = new Date(previousEnd.getFullYear(), previousEnd.getMonth(), 1);
        } else if (period === 'year') {
            currentStart = new Date(now.getFullYear(), 0, 1);
            previousEnd = new Date(currentStart);
            previousEnd.setMilliseconds(-1);
            previousStart = new Date(previousEnd.getFullYear(), 0, 1);
        } else {
            currentStart = new Date(0);
            previousStart = new Date(0);
            previousEnd = new Date(0);
        }

        let currentTransactions, previousTransactions;

        if (period === 'all') {
            currentTransactions = await Transaction.find({ userId }).lean();
            previousTransactions = [];
        } else {
            [currentTransactions, previousTransactions] = await Promise.all([
                Transaction.find({ userId, date: { $gte: currentStart } }).lean(),
                Transaction.find({ userId, date: { $gte: previousStart, $lte: previousEnd } }).lean(),
            ]);
        }

        // Silently widen to all-time if the requested period has no expenses
        let effectivePeriod = period;
        let effectiveCurrent = currentTransactions;
        let effectivePrevious = previousTransactions;
        if (period !== 'all' && currentTransactions.filter(t => t.type === 'expense').length === 0) {
            effectiveCurrent = await Transaction.find({ userId }).lean();
            effectivePrevious = [];
            effectivePeriod = 'all';
        }

        const insights = await exports.generateInsights(effectiveCurrent, effectivePrevious, effectivePeriod);

        await Insight.findOneAndUpdate(
            { userId, period },
            { insights, generatedAt: new Date() },
            { upsert: true, returnDocument: 'after' }
        );

        try {
            await InsightHistory.create({ userId, period, insights, generatedAt: new Date() });
        } catch (histErr) {
            console.error("Failed to save insight history:", histErr);
        }

        res.json({ insights });
    } catch (err) {
        console.error("Failed to generate insights:", err);
        if (isOverloadError(err)) {
            // Serve stale cache before giving up — better than a 503 blank
            const stale = await Insight.findOne({ userId: req.user.id, period: req.query.period || "month" }).catch(() => null);
            if (stale) return res.json({ insights: stale.insights, cached: true, stale: true });
            return res.status(503).set("Retry-After", "60").json({ message: "AI system is busy, please retry shortly." });
        }
        const stale = await Insight.findOne({ userId: req.user.id, period: req.query.period || 'month' }).catch(() => null);
        if (stale) {
            return res.json({ insights: stale.insights, cached: true, stale: true });
        }
        res.status(500).json({ message: "Failed to generate insights" });
    }
};

// GET /api/ai/insights/history
exports.getInsightHistory = async (req, res) => {
    try {
        const history = await InsightHistory.find({ userId: req.user.id })
            .sort({ generatedAt: -1 })
            .limit(15)
            .select("period insights generatedAt -_id")
            .lean();
        res.json({ history });
    } catch (err) {
        console.error("Failed to fetch insight history:", err);
        res.status(500).json({ message: "Failed to fetch insight history" });
    }
};

// GET /api/ai/anomalies
exports.checkAnomalies = async (req, res) => {
    try {
        // Anomaly detection only needs recent history (last 90 days) to compute a
        // meaningful average. Loading all-time transactions per user at 100 concurrent
        // users would exhaust the MongoDB connection pool.
        const since = new Date();
        since.setDate(since.getDate() - 90);
        const transactions = await Transaction.find(
            { userId: req.user.id, date: { $gte: since } }
        ).lean();
        const alert = await exports.detectAnomalies(transactions, req.user.id);
        res.json({ alert });
    } catch (err) {
        if (isOverloadError(err)) {
            return res.status(503).set("Retry-After", "60").json({ message: "AI system is busy, please retry shortly." });
        }
        res.status(500).json({ message: "Failed to check anomalies" });
    }
};

// GET /api/ai/accuracy
exports.getAccuracy = async (req, res) => {
    try {
        const userId = req.user.id;

        const [aiCategorized, confirmed, rejected, pending, recentCorrections] = await Promise.all([
            Transaction.countDocuments({ userId, aiSuggestedCategory: { $ne: null } }),
            Transaction.countDocuments({ userId, aiSuggestedCategory: { $ne: null }, aiConfirmed: true }),
            Transaction.countDocuments({ userId, aiSuggestedCategory: { $ne: null }, $or: [{ aiConfirmed: false }, { userOverrode: true, aiConfirmed: null }] }),
            Transaction.countDocuments({ userId, aiSuggestedCategory: { $ne: null }, aiConfirmed: null, userOverrode: false }),
            CategoryCorrection.find({ userId })
                .sort({ createdAt: -1 })
                .limit(10)
                .select("description originalCategory correctedCategory createdAt"),
        ]);

        const reviewed = confirmed + rejected;
        const accuracyRate = reviewed > 0
            ? Math.round((confirmed / reviewed) * 100)
            : null;

        res.json({ aiCategorized, confirmed, rejected, pending, accuracyRate, recentCorrections });
    } catch (err) {
        console.error("Accuracy fetch error:", err);
        res.status(500).json({ message: "Failed to compute accuracy" });
    }
};

// Builds chart-ready forecast data from an array of expense transactions.
// Returns { forecastData, predictedAmount, history } — reused by getForecast + getAIDashboard.
function buildForecastData(transactions) {
    const monthlyData = {};
    for (const t of transactions) {
        const date = new Date(t.date);
        const key  = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
        const monthName = date.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
        if (!monthlyData[key]) monthlyData[key] = { key, monthName, amount: 0 };
        monthlyData[key].amount += t.amount;
    }

    const history = Object.keys(monthlyData).sort().slice(-6).map(k => monthlyData[k]);

    if (history.length < 2) {
        return {
            forecastData:    history.map(d => ({ month: d.monthName, actual: d.amount, predicted: null })),
            predictedAmount: null,
            history,
        };
    }

    let weightedSum = 0, weightTotal = 0;
    history.forEach((item, i) => { weightedSum += item.amount * (i + 1); weightTotal += (i + 1); });
    const predictedAmount = weightedSum / weightTotal;

    const lastDate = new Date(history[history.length - 1].key + "-01T00:00:00Z");
    lastDate.setUTCMonth(lastDate.getUTCMonth() + 1);
    const nextMonthName = lastDate.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });

    const forecastData = history.map(d => ({ month: d.monthName, actual: d.amount, predicted: null }));
    forecastData[forecastData.length - 1].predicted = history[history.length - 1].amount;
    forecastData[forecastData.length - 1].isBridge  = true;
    forecastData.push({ month: nextMonthName, actual: null, predicted: predictedAmount });

    return { forecastData, predictedAmount, history };
}

// GET /api/ai/forecast
exports.getForecast = async (req, res) => {
    try {
        const userId = req.user.id;
        const transactions = await Transaction.find({ userId, type: "expense" }).lean();

        const NO_DATA = {
            forecastData: [],
            insight: "Add some transactions to generate a forecast.",
            months: [],
        };

        if (!transactions.length) return res.json(NO_DATA);

        // Group totals by "YYYY-MM" and category
        const byMonth = {};
        for (const t of transactions) {
            const d = new Date(t.date);
            const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
            if (!byMonth[key]) byMonth[key] = {};
            byMonth[key][t.category] = (byMonth[key][t.category] || 0) + t.amount;
        }

        // Take the 3 most recent months (oldest → newest), including the current in-progress month
        const recentMonths = Object.keys(byMonth).sort().slice(-3);

        if (!recentMonths.length) return res.json(NO_DATA);

        // Equal weighting for < 3 months, spec weights for exactly 3
        const weightMap = {
            1: [1.0],
            2: [0.5, 0.5],
            3: [0.20, 0.30, 0.50],
        };
        const weights = weightMap[recentMonths.length];

        // Collect every category seen across the window
        const allCategories = new Set(
            recentMonths.flatMap(m => Object.keys(byMonth[m] || {}))
        );

        // Compute per-category weighted forecast
        // recentMonths is sorted oldest→newest, so index 0 = m3 (oldest), last = m1 (most recent)
        const forecastData = [];
        for (const category of allCategories) {
            const amounts = recentMonths.map(m => byMonth[m]?.[category] || 0);
            const weighted = amounts.reduce((sum, amt, i) => sum + amt * weights[i], 0);
            if (weighted <= 0) continue;

            const len = recentMonths.length;
            forecastData.push({
                category,
                forecastAmount: Math.round(weighted),
                m1: amounts[len - 1],               // most recent
                m2: len >= 2 ? amounts[len - 2] : 0, // middle
                m3: len >= 3 ? amounts[0] : 0,        // oldest
            });
        }

        forecastData.sort((a, b) => b.forecastAmount - a.forecastAmount);

        const toLabel = (key) => {
            const [y, m] = key.split("-").map(Number);
            return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
        };
        // months array is ordered oldest (m3) → most recent (m1)
        const months = recentMonths.map(toLabel);

        if (!forecastData.length) return res.json({ ...NO_DATA, months });

        // Build Gemini prompt
        const top3 = forecastData.slice(0, 3);
        const total = forecastData.reduce((s, c) => s + c.forecastAmount, 0);
        const listLines = top3.map(c => `- ${c.category}: ₦${c.forecastAmount.toLocaleString()}`).join("\n");
        const prompt =
            `Top 3 spending categories predicted for next month:\n${listLines}\n` +
            `Overall predicted total for next month: ₦${total.toLocaleString()}\n\n` +
            `You are a financial advisor for a Nigerian university student. Based on this forecast, ` +
            `write ONE practical sentence of financial advice. Keep it under 25 words. ` +
            `Do not use the word 'forecast' or 'algorithm'. Focus on the highest-spend category.`;

        let insight = `Your highest predicted spend is ${top3[0].category} — budget for it early to stay on track.`;
        try {
            const result = await generate(prompt);
            insight = result.response.text().trim();
        } catch (err) {
            console.error("Gemini forecast insight error:", err.message);
        }

        res.json({ forecastData, insight, months });
    } catch (err) {
        console.error("Forecast generation error:", err);
        res.status(500).json({ message: "Failed to generate forecast" });
    }
};

const SUGGESTION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// GET /api/ai/budget-suggestions
exports.getBudgetSuggestions = async (req, res) => {
    try {
        const userId = req.user.id;

        const cached = await BudgetSuggestion.findOne({ userId }).sort({ generatedAt: -1 }).lean();
        if (cached && Date.now() - new Date(cached.generatedAt).getTime() < SUGGESTION_TTL_MS) {
            return res.json({ suggestions: cached.suggestions, overallTip: cached.overallTip, source: cached.source, cached: true });
        }

        const { spendingSummary, existingBudgets } = await getCategorySpendingSummary(userId, 3);

        if (spendingSummary.length === 0) {
            return res.json({
                suggestions: [],
                overallTip: "Add some transactions to get personalised budget suggestions.",
                source: "rule-based",
                cached: false,
            });
        }

        let result;
        let source;
        try {
            result = await getAIBudgetSuggestions(userId, spendingSummary, existingBudgets);
            source = "gemini";
        } catch (aiErr) {
            if (aiErr.isQuotaError || aiErr.isLimiterError || aiErr.isTimeout) {
                console.warn("⚠️  Budget suggestions: Gemini unavailable, using rule-based fallback");
            } else {
                console.error("Budget suggestions AI error:", aiErr.message);
            }
            result = getRuleBasedBudgetSuggestions(spendingSummary);
            source = "rule-based";
        }

        await BudgetSuggestion.findOneAndUpdate(
            { userId },
            { suggestions: result.suggestions, overallTip: result.overallTip, source, generatedAt: new Date() },
            { upsert: true },
        );

        res.json({ suggestions: result.suggestions, overallTip: result.overallTip, source, cached: false });
    } catch (err) {
        console.error("getBudgetSuggestions error:", err);
        if (isOverloadError(err)) {
            return res.status(503).set("Retry-After", "60").json({ message: "AI system is busy, please retry shortly." });
        }
        res.status(500).json({ message: "Failed to generate budget suggestions" });
    }
};

// GET /api/ai/dashboard — single DB fetch, all three Gemini calls concurrent
exports.getAIDashboard = async (req, res) => {
    try {
        const userId = req.user.id;
        const period = req.query.period || "month";
        const forceRefresh = req.query.refresh === "true";

        // Check insights cache before the DB fetch so we can skip that Gemini call if warm
        const cachedInsights = await Insight.findOne({ userId, period });
        const insightsCached = !forceRefresh && cachedInsights &&
            Date.now() - cachedInsights.generatedAt.getTime() < INSIGHT_TTL_MS;

        // One DB round-trip for all AI data
        const allTransactions = await Transaction.find({ userId }).lean();

        // Build period date ranges (mirrors getInsights logic)
        const now = new Date();
        let currentStart, previousStart, previousEnd;
        if (period === "week") {
            const day = now.getDay() || 7;
            currentStart = new Date(now); currentStart.setHours(0, 0, 0, 0); currentStart.setDate(now.getDate() - day + 1);
            previousEnd  = new Date(currentStart); previousEnd.setMilliseconds(-1);
            previousStart = new Date(previousEnd);  previousStart.setDate(previousStart.getDate() - 6); previousStart.setHours(0, 0, 0, 0);
        } else if (period === "month") {
            currentStart  = new Date(now.getFullYear(), now.getMonth(), 1);
            previousEnd   = new Date(currentStart); previousEnd.setMilliseconds(-1);
            previousStart = new Date(previousEnd.getFullYear(), previousEnd.getMonth(), 1);
        } else if (period === "year") {
            currentStart  = new Date(now.getFullYear(), 0, 1);
            previousEnd   = new Date(currentStart); previousEnd.setMilliseconds(-1);
            previousStart = new Date(previousEnd.getFullYear(), 0, 1);
        } else {
            currentStart = previousStart = previousEnd = new Date(0);
        }

        const currentTransactions  = period === "all" ? allTransactions
            : allTransactions.filter(t => new Date(t.date) >= currentStart);
        const previousTransactions = period === "all" ? []
            : allTransactions.filter(t => new Date(t.date) >= previousStart && new Date(t.date) <= previousEnd);

        // Silently widen to all-time if the requested period has no expenses
        const noCurrentExpenses = period !== "all" && currentTransactions.filter(t => t.type === "expense").length === 0;
        const effectivePeriod = noCurrentExpenses ? "all" : period;
        const effectiveCurrentTx = noCurrentExpenses ? allTransactions : currentTransactions;
        const effectivePreviousTx = noCurrentExpenses ? [] : previousTransactions;

        // Build forecast data from expenses in the shared transaction set
        const { forecastData, predictedAmount, history } = buildForecastData(
            allTransactions.filter(t => t.type === "expense")
        );

        // Build the forecast Gemini prompt lazily (only if there's enough data)
        let forecastGeminiPromise = Promise.resolve(
            predictedAmount !== null
                ? `Based on your recent spending, we project your expenses will be around ₦${predictedAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })} next month.`
                : null
        );
        if (predictedAmount !== null && history.length >= 2) {
            const fPrompt = `A user has the following recent monthly expense totals (in NGN):
${history.map(h => `${h.monthName}: ₦${h.amount.toLocaleString()}`).join("\n")}

The statistical forecast for next month is ₦${predictedAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}.
Write a single, encouraging, and practical 1-sentence financial insight or tip about this trend for the user. Do not mention the exact word "statistical forecast". Focus on actionable advice.`;
            forecastGeminiPromise = generate(fPrompt)
                .then(r => r.response.text().trim())
                .catch(() => `Based on your recent spending, we project your expenses will be around ₦${predictedAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })} next month.`);
        }

        // All three Gemini calls fire concurrently
        const [insightsResult, anomaly, forecastInsight] = await Promise.all([
            insightsCached
                ? Promise.resolve(cachedInsights.insights)
                : exports.generateInsights(effectiveCurrentTx, effectivePreviousTx, effectivePeriod),
            exports.detectAnomalies(allTransactions, userId),
            forecastGeminiPromise,
        ]);

        // Persist refreshed insights
        if (!insightsCached) {
            Insight.findOneAndUpdate(
                { userId, period },
                { insights: insightsResult, generatedAt: new Date() },
                { upsert: true }
            ).catch(err => console.error("Failed to persist insights cache:", err));
        }

        res.json({ insights: insightsResult, anomaly, forecastData, forecastInsight });
    } catch (err) {
        console.error("AI dashboard error:", err);
        if (isOverloadError(err)) {
            // Serve stale insights from the DB cache so the dashboard isn't blank
            const stale = await Insight.findOne({ userId: req.user.id, period: req.query.period || "month" }).catch(() => null);
            if (stale) {
                return res.json({ insights: stale.insights, anomaly: null, forecastData: [], forecastInsight: null, stale: true });
            }
            return res.status(503).set("Retry-After", "60").json({ message: "AI system is busy, please retry shortly." });
        }
        res.status(500).json({ message: "Failed to load AI dashboard" });
    }
};