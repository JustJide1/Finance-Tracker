const { GoogleGenerativeAI } = require("@google/generative-ai");
const Transaction = require("../models/Transaction");

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

    if (!text || text.trim().length < 3) {
        return res.status(400).json({
            message: "Please enter a longer description"
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
    if (/shoprite|spar|market|grocery|food|eat|restaurant|suya|chicken|rice|bread/.test(desc))
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

    return "Other";
};

// Auto-categorize a transaction
exports.categorizeTransaction = async (description) => {
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
- Other

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
exports.generateInsights = async (transactions) => {
    if (transactions.length === 0) {
        return ["Add more transactions to get personalized insights!"];
    }

    const expenseTransactions = transactions.filter(t => t.type === "expense");
    if (expenseTransactions.length === 0) {
        return ["No expenses yet. Start tracking to get insights!"];
    }

    const totalSpent = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
    const categoryBreakdown = {};

    expenseTransactions.forEach(t => {
        categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + t.amount;
    });

    const topCategory = Object.entries(categoryBreakdown)
        .sort((a, b) => b[1] - a[1])[0];

    const summary = `
Total spent: ₦${totalSpent.toLocaleString()}
Number of transactions: ${expenseTransactions.length}
Top spending category: ${topCategory[0]} (₦${topCategory[1].toLocaleString()})
All categories: ${JSON.stringify(categoryBreakdown)}
`;

    const prompt = `You are a Nigerian financial advisor. Analyze this spending data and provide 3 SHORT, actionable insights.

${summary}

Format your response as a JSON array of exactly 3 strings. Each insight should be one sentence, practical, and specific to Nigerian context.

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
        // Return meaningful static fallback so UI never breaks
        return [
            `You've made ${expenseTransactions.length} expense transaction(s) this period.`,
            `Your top spending category is ${topCategory[0]} (₦${topCategory[1].toLocaleString()}).`,
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
        const category = await exports.categorizeTransaction(description);
        res.json({ category });
    } catch (err) {
        res.status(500).json({ message: "Failed to categorize" });
    }
};

const insightsCache = new Map();

// GET /api/ai/insights
exports.getInsights = async (req, res) => {
    try {
        const userId = req.user.id;
        const cacheKey = `insights_${userId}`;
        const cached = insightsCache.get(cacheKey);

        // Return cached result if less than 1 hour old
        if (cached && Date.now() - cached.timestamp < 60 * 60 * 1000) {
            return res.json({ insights: cached.data, cached: true });
        }

        const transactions = await Transaction.find({ userId });
        const insights = await exports.generateInsights(transactions);

        // Store in cache
        insightsCache.set(cacheKey, { data: insights, timestamp: Date.now() });

        res.json({ insights });
    } catch (err) {
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