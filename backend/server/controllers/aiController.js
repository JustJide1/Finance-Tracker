const { GoogleGenerativeAI } = require("@google/generative-ai");
const Transaction = require("../models/Transaction");
const Insight = require("../models/Insight");
const CategoryCorrection = require("../models/CategoryCorrection");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
const fallbackModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

/**
 * Retries a Gemini generateContent call with exponential backoff.
 * Falls back to gemini-1.5-flash after primary model exhausts retries.
 * @param {object} primaryModel - The primary Gemini model instance
 * @param {string} prompt - The prompt to send
 * @param {number} maxRetries - Max attempts on primary model (default 3)
 * @returns {Promise<object>} Gemini result object
 */
async function generateWithRetry(primaryModel, prompt, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await primaryModel.generateContent(prompt);
        } catch (error) {
            const is503 = error.status === 503 ||
                (error.message && error.message.includes("503")) ||
                (error.message && error.message.toLowerCase().includes("service unavailable"));

            const is429 = error.status === 429 ||
                (error.message && error.message.includes("429")) ||
                (error.message && error.message.toLowerCase().includes("quota exceeded")) ||
                (error.message && error.message.toLowerCase().includes("too many requests"));

            if (is503 && attempt < maxRetries) {
                const delayMs = Math.pow(2, attempt) * 1000; // 2s, 4s
                console.warn(`⚠️  Gemini 503 on attempt ${attempt}/${maxRetries}. Retrying in ${delayMs / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
            } else if ((is503 && attempt === maxRetries) || is429) {
                // Primary model exhausted or quota reached – try fallback immediately
                console.warn(`⚠️  Primary model ${is429 ? "quota exceeded (429)" : "exhausted"}. Falling back to gemini-2.0-flash...`);
                return await fallbackModel.generateContent(prompt);
            } else {
                throw error; // Other errors bubble up immediately
            }
        }
    }
}



// Test Gemini connection
exports.testGemini = async (req, res) => {
    const { GoogleGenerativeAI } = require("@google/generative-ai");

    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY not found in environment" });
    }

    try {
        const result = await generateWithRetry(model, "Say hello");
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
        const { parseNaturalLanguage } = require("../services/aiService");
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
    if (/invest|stock|crypto|savings|deposit/.test(desc))
        return "Investment";
    if (/amazon|jumia|konga|shopping|clothes|fashion|shoe/.test(desc))
        return "Shopping";
    if (/mum|mom|dad|father|mother|parent|sibling|brother|sister|family|sent to|send to|support/.test(desc))
        return "Family Support";
    if (/salon|barber|haircut|spa|grooming|skincare|beauty|personal care|cosmetics|manicure|pedicure|barbing/.test(desc))
        return "Personal Care";

    return "Other";
};

// Auto-categorize a transaction, optionally using recent user corrections as few-shot examples
exports.categorizeTransaction = async (description, recentCorrections = []) => {
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
- Investment
- Salary
- Business
- Gifts
- Family Support
- Personal Care
- Other
${fewShotSection}
Transaction description: "${description}"

Respond with ONLY the category name, nothing else.`;

    try {
        const result = await generateWithRetry(model, prompt);
        const category = result.response.text().trim();
        console.log("✅ Gemini categorized:", description, "→", category);
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

    const prompt = `You are a Nigerian financial advisor. Analyze this spending data and provide 3 SHORT, actionable insights.

${summary}

Format your response as a JSON array of exactly 3 strings. Each insight should be one sentence, practical, and specific to Nigerian context. Focus on the comparison if available.

Example format:
["Your Food spending is 40% of total expenses - consider meal prepping to save ₦5,000/month", "Transport costs are high - explore carpooling or bulk transport subscriptions", "Entertainment spending doubled this month - set a ₦10,000 weekly limit"]

Respond with ONLY the JSON array, no other text.`;

    try {
        const result = await generateWithRetry(model, prompt);
        let response = result.response.text().trim();

        response = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

        const insights = JSON.parse(response);
        return Array.isArray(insights) ? insights.slice(0, 3) : ["Keep tracking your expenses to get insights!"];
    } catch (error) {
        console.error("Gemini insights error:", error);
        return [
            `You've made ${currentExpenses.length} expense transaction(s) this ${period}.`,
            topCategory ? `Your top spending category is ${topCategory[0]} (₦${topCategory[1].toLocaleString()}).` : "Start tracking expenses to see your top category.",
            "AI insights are temporarily unavailable. Please try again in a moment."
        ];
    }
};

// Detect anomalies
exports.detectAnomalies = async (transactions) => {
    if (transactions.length < 10) {
        return null;
    }

    const expenses = transactions
        .filter(t => t.type === "expense")
        .map(t => t.amount);

    const average = expenses.reduce((a, b) => a + b, 0) / expenses.length;
    const threshold = average * 2;

    const anomalies = transactions.filter(
        t => t.type === "expense" && t.amount > threshold
    );

    if (anomalies.length === 0) return null;

    const prompt = `A user made these unusually large purchases (average spending: ₦${average.toFixed(0)}):

${anomalies.map(a => `- ₦${a.amount.toLocaleString()} on ${a.category}: ${a.description}`).join("\n")}

Write ONE friendly alert message (max 20 words) asking if these were intended purchases.

Respond with ONLY the message text, no quotes or formatting.`;

    try {
        const result = await generateWithRetry(model, prompt);
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
        const recentCorrections = await CategoryCorrection.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(10)
            .select("description originalCategory correctedCategory");
        const category = await exports.categorizeTransaction(description, recentCorrections);
        res.json({ category });
    } catch (err) {
        res.status(500).json({ message: "Failed to categorize" });
    }
};

const INSIGHT_TTL_MS = 60 * 60 * 1000; // 1 hour

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

        const allTransactions = await Transaction.find({ userId });
        
        let currentTransactions = allTransactions;
        let previousTransactions = [];

        if (period !== 'all') {
            currentTransactions = allTransactions.filter(t => new Date(t.date) >= currentStart);
            previousTransactions = allTransactions.filter(t => new Date(t.date) >= previousStart && new Date(t.date) <= previousEnd);
        }

        const insights = await exports.generateInsights(currentTransactions, previousTransactions, period);

        await Insight.findOneAndUpdate(
            { userId, period },
            { insights, generatedAt: new Date() },
            { upsert: true, new: true }
        );

        res.json({ insights });
    } catch (err) {
        console.error("Failed to generate insights:", err);
        res.status(500).json({ message: "Failed to generate insights" });
    }
};

// GET /api/ai/anomalies
exports.checkAnomalies = async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.user.id });
        const alert = await exports.detectAnomalies(transactions);
        res.json({ alert });
    } catch (err) {
        res.status(500).json({ message: "Failed to check anomalies" });
    }
};

// GET /api/ai/accuracy
exports.getAccuracy = async (req, res) => {
    try {
        const userId = req.user.id;

        const [aiCategorized, corrected, recentCorrections] = await Promise.all([
            Transaction.countDocuments({ userId, aiSuggestedCategory: { $ne: null } }),
            Transaction.countDocuments({ userId, aiSuggestedCategory: { $ne: null }, userOverrode: true }),
            CategoryCorrection.find({ userId })
                .sort({ createdAt: -1 })
                .limit(10)
                .select("description originalCategory correctedCategory createdAt"),
        ]);

        const accepted = aiCategorized - corrected;
        const accuracyRate = aiCategorized > 0
            ? Math.round((accepted / aiCategorized) * 100)
            : null;

        res.json({ aiCategorized, accepted, corrected, accuracyRate, recentCorrections });
    } catch (err) {
        console.error("Accuracy fetch error:", err);
        res.status(500).json({ message: "Failed to compute accuracy" });
    }
};

// GET /api/ai/forecast
exports.getForecast = async (req, res) => {
    try {
        const userId = req.user.id;
        const transactions = await Transaction.find({ userId, type: "expense" });

        if (!transactions || transactions.length === 0) {
            return res.json({ forecastData: [], insight: "Not enough data to generate a forecast." });
        }

        const monthlyData = {};
        transactions.forEach(t => {
            const date = new Date(t.date);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthName = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
            
            if (!monthlyData[key]) {
                monthlyData[key] = { key, monthName, amount: 0 };
            }
            monthlyData[key].amount += t.amount;
        });

        const sortedKeys = Object.keys(monthlyData).sort();
        const recentKeys = sortedKeys.slice(-6);
        const history = recentKeys.map(k => monthlyData[k]);

        if (history.length < 2) {
             return res.json({ 
                 forecastData: history.map(d => ({ month: d.monthName, actual: d.amount, predicted: null })),
                 insight: "We need at least two months of data to make a reliable prediction."
             });
        }

        let weightedSum = 0;
        let weightTotal = 0;
        history.forEach((item, index) => {
            const weight = index + 1;
            weightedSum += item.amount * weight;
            weightTotal += weight;
        });
        const predictedAmount = weightedSum / weightTotal;

        const lastDate = new Date(history[history.length - 1].key + "-01T00:00:00");
        lastDate.setMonth(lastDate.getMonth() + 1);
        const nextMonthName = lastDate.toLocaleDateString("en-US", { month: "short", year: "numeric" });

        const forecastData = history.map(d => ({
            month: d.monthName,
            actual: d.amount,
            predicted: null
        }));
        
        const lastActual = history[history.length - 1].amount;
        forecastData[forecastData.length - 1].predicted = lastActual;
        
        forecastData.push({
            month: nextMonthName,
            actual: null,
            predicted: predictedAmount
        });

        let insight = `Based on your recent spending, we project your expenses will be around ₦${predictedAmount.toLocaleString(undefined, {maximumFractionDigits:0})} next month.`;
        
        const prompt = `A user has the following recent monthly expense totals (in NGN):
${history.map(h => `${h.monthName}: ₦${h.amount.toLocaleString()}`).join("\n")}

The statistical forecast for next month is ₦${predictedAmount.toLocaleString(undefined, {maximumFractionDigits:0})}.
Write a single, encouraging, and practical 1-sentence financial insight or tip about this trend for the user. Do not mention the exact word "statistical forecast". Focus on actionable advice.`;

        try {
            const { generateWithRetry } = require("./aiController"); // Already imported in scope, but actually it's just available as `generateWithRetry`.
            const result = await generateWithRetry(model, prompt);
            insight = result.response.text().trim();
        } catch (err) {
            console.error("Gemini forecast insight error:", err.message);
        }

        res.json({ forecastData, insight });

    } catch (err) {
        console.error("Forecast generation error:", err);
        res.status(500).json({ message: "Failed to generate forecast" });
    }
};