const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
- Family Support
- Personal Care
- Other

Transaction description: "${description}"

Respond with ONLY the category name, nothing else.`;

    try {
        const result = await model.generateContent(prompt);
        const category = result.response.text().trim();
        return category;
    } catch (error) {
        console.error("Gemini categorization error:", error);
        return "Other";
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

    // Prepare data summary
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
        const result = await model.generateContent(prompt);
        let response = result.response.text().trim();

        // Clean up markdown code blocks if present
        response = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

        const insights = JSON.parse(response);
        return Array.isArray(insights) ? insights.slice(0, 3) : ["Keep tracking your expenses to get insights!"];
    } catch (error) {
        console.error("Gemini insights error:", error);
        return [
            "You've made " + expenseTransactions.length + " transactions this period",
            "Your top spending category is " + topCategory[0],
            "Keep tracking to get personalized insights!"
        ];
    }
};

// Detect anomalies (unusual spending)
exports.detectAnomalies = async (transactions) => {
    if (transactions.length < 10) {
        return null; // Not enough data
    }

    const expenses = transactions
        .filter(t => t.type === "expense")
        .map(t => t.amount);

    const average = expenses.reduce((a, b) => a + b, 0) / expenses.length;
    const threshold = average * 2; // 2x average = anomaly

    const anomalies = transactions.filter(
        t => t.type === "expense" && t.amount > threshold
    );

    if (anomalies.length === 0) return null;

    const prompt = `A user made these unusually large purchases (average spending: ₦${average.toFixed(0)}):

${anomalies.map(a => `- ₦${a.amount.toLocaleString()} on ${a.category}: ${a.description}`).join("\n")}

Write ONE friendly alert message (max 20 words) asking if these were intended purchases.

Respond with ONLY the message text, no quotes or formatting.`;

    try {
        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (error) {
        console.error("Gemini anomaly detection error:", error);
        return null;
    }
};

// Parse natural language into structured transaction data
    exports.parseNaturalLanguage = async (text) => {
        const today = new Date().toISOString().split("T")[0];

        const prompt = `You are a financial transaction parser for a Nigerian expense tracker app. Your job is to extract structured data from natural language input.

EXTRACTION RULES:

1. TYPE: Determine if it's "income" (money received) or "expense" (money spent)
   - Income keywords: received, earned, got paid, salary, payment came, made, profit
   - Expense keywords: spent, bought, paid, used, cost
   - Default to "expense" if unclear but money was used

2. AMOUNT: Extract the numeric value in Naira (NGN)
   - "1k" = 1000, "1.5k" = 1500, "2k" = 2000
   - "1m" = 1000000, "500k" = 500000
   - "₦5000" or "5000 naira" = 5000
   - "five thousand" = 5000
   - RANGE AMOUNTS: If a range is given (e.g. "2k–5k", "between 2k and 5k", "2k to 5k"), use the AVERAGE of the two values. Example: "between 2k and 5k" → 3500
   - FOREIGN CURRENCY CONVERSION (convert to Naira using these approximate rates):
     * USD ($): multiply by 1380. Example: "$50" → 69000
     * GBP (£): multiply by 1890. Example: "£30" → 56700
     * EUR (€): multiply by 1630. Example: "€20" → 32600
     * CAD: multiply by 1030. Example: "CAD 100" → 103000
   - When converting foreign currency, note the original amount in the description
   - Always return as number (Naira equivalent)

3. CATEGORY: Choose the BEST match from this list ONLY:
   Food & Dining, Transportation, Shopping, Entertainment, Bills & Utilities, Healthcare, Education, Investment, Salary, Business, Gifts, Family Support, Personal Care, Other
   - Family Support: money sent to family, supporting parents/siblings, remittance
   - Personal Care: haircut, salon, spa, grooming, skincare, cosmetics, barbing

4. DESCRIPTION: Create a clean, concise description (3-8 words). If currency was converted, include the original amount, e.g. "Groceries ($50 → ₦80,000)"

5. DATE: Today's date is ${today}
   - "today" → ${today}
   - "yesterday" → today minus 1 day
   - "2 days ago" → today minus 2 days
   - If no date mentioned, use ${today}
   - Always return YYYY-MM-DD format

6. CONFIDENCE:
   - "high" if all fields are clearly extractable
   - "medium" if you had to make reasonable assumptions
   - "low" if input is too vague

7. MISSING FIELDS: List any fields you couldn't extract confidently

OUTPUT FORMAT: Respond with ONLY a valid JSON object. No markdown, no code blocks, no explanation.

EXAMPLES:

Input: "Spent 1k on food today"
Output: {"type":"expense","amount":1000,"category":"Food & Dining","description":"Food expense","date":"${today}","confidence":"high","missingFields":[]}

Input: "Got my salary 250k yesterday"
Output: {"type":"income","amount":250000,"category":"Salary","description":"Monthly salary","date":"YESTERDAY_DATE","confidence":"high","missingFields":[]}

Input: "Spent between 2k and 5k on shopping"
Output: {"type":"expense","amount":3500,"category":"Shopping","description":"Shopping (range avg)","date":"${today}","confidence":"medium","missingFields":[]}

Input: "Spent $50 on groceries"
Output: {"type":"expense","amount":80000,"category":"Food & Dining","description":"Groceries ($50 → ₦80,000)","date":"${today}","confidence":"high","missingFields":[]}

Input: "Sent 10k to mum"
Output: {"type":"expense","amount":10000,"category":"Family Support","description":"Money sent to mum","date":"${today}","confidence":"high","missingFields":[]}

Input: "Haircut 3k"
Output: {"type":"expense","amount":3000,"category":"Personal Care","description":"Haircut","date":"${today}","confidence":"high","missingFields":[]}

Input: "Bought stuff"
Output: {"type":"expense","amount":0,"category":"Other","description":"Unspecified purchase","date":"${today}","confidence":"low","missingFields":["amount","specific category","description"]}

Now parse this input:
"${text}"`;

        try {
            const result = await model.generateContent(prompt);
            let response = result.response.text().trim();

            // Clean up markdown if present
            response = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

            const parsed = JSON.parse(response);
            console.log("✅ Gemini parsed:", text, "→", parsed);
            return parsed;
        } catch (error) {
            if (error.message?.includes("429")) {
                console.warn("⚠️ Gemini quota exceeded, using rule-based parser");
                return parseByRules(text);
            }
            console.error("❌ Gemini parse error:", error.message);
            return parseByRules(text);
        }
    };

    // Rule-based fallback parser
    const parseByRules = (text) => {
        const lower = text.toLowerCase();
        const today = new Date().toISOString().split("T")[0];

        // Detect type
        const isIncome = /received|earned|got paid|salary|profit|made/.test(lower);
        const type = isIncome ? "income" : "expense";

        // ── Foreign currency detection ──────────────────────────────────────
        const FOREX = [
            { regex: /\$\s*(\d+\.?\d*)/, rate: 1380, symbol: "$" },
            { regex: /£\s*(\d+\.?\d*)/, rate: 1890, symbol: "£" },
            { regex: /€\s*(\d+\.?\d*)/, rate: 1630, symbol: "€" },
            { regex: /cad\s*(\d+\.?\d*)/i, rate: 1030, symbol: "CAD" },
        ];
        let foreignNote = "";
        let amount = 0;
        let detectedFx = false;

        for (const fx of FOREX) {
            const m = lower.match(fx.regex) || text.match(fx.regex);
            if (m) {
                const foreign = parseFloat(m[1]);
                amount = Math.round(foreign * fx.rate);
                foreignNote = ` (${fx.symbol}${foreign} → ₦${amount.toLocaleString()})`;
                detectedFx = true;
                break;
            }
        }

        if (!detectedFx) {
            // ── Naira range detection ("between 2k and 5k" / "2k-5k") ────────
            const rangeMatch = lower.match(/(\d+\.?\d*)\s*k?\s*(?:to|-|–|and)\s*(\d+\.?\d*)\s*k/i);
            if (rangeMatch) {
                const lo = parseFloat(rangeMatch[1]) * (lower.indexOf('k') < lower.indexOf(rangeMatch[1]) ? 1 : 1000);
                const hi = parseFloat(rangeMatch[2]) * 1000;
                // Simpler: both sides multiplied by 1000 if 'k' suffix present
                const loVal = lower.match(new RegExp(rangeMatch[1] + '\\s*k')) ? parseFloat(rangeMatch[1]) * 1000 : parseFloat(rangeMatch[1]);
                amount = Math.round((loVal + hi) / 2);
            } else {
                // ── Standard Naira amount detection ──────────────────────────
                const mMatch = lower.match(/(\d+\.?\d*)\s*m(?!\w)/);
                const kMatch = lower.match(/(\d+\.?\d*)\s*k(?!\w)/);
                const numMatch = lower.match(/₦?\s*(\d{2,})/);

                if (mMatch) amount = parseFloat(mMatch[1]) * 1000000;
                else if (kMatch) amount = parseFloat(kMatch[1]) * 1000;
                else if (numMatch) amount = parseInt(numMatch[1]);
            }
        }

        // Detect date
        let date = today;
        if (/yesterday/.test(lower)) {
            const d = new Date();
            d.setDate(d.getDate() - 1);
            date = d.toISOString().split("T")[0];
        }

        // Detect category
        let category = "Other";
        if (/uber|bolt|taxi|bus|transport|fuel|petrol|keke|okada/.test(lower)) category = "Transportation";
        else if (/shoprite|spar|food|eat|restaurant|suya|rice|jollof|lunch|dinner|breakfast/.test(lower)) category = "Food & Dining";
        else if (/netflix|spotify|cinema|movie|game|dstv/.test(lower)) category = "Entertainment";
        else if (/nepa|electricity|water|internet|wifi|mtn|airtel|glo|bill/.test(lower)) category = "Bills & Utilities";
        else if (/hospital|pharmacy|doctor|clinic|drug|medicine/.test(lower)) category = "Healthcare";
        else if (/school|tuition|course|book|education/.test(lower)) category = "Education";
        else if (/salary|wages|payment|freelance/.test(lower)) category = "Salary";
        else if (/invest|stock|crypto|savings/.test(lower)) category = "Investment";
        else if (/amazon|jumia|konga|shopping|clothes/.test(lower)) category = "Shopping";
        else if (/mum|mom|dad|father|mother|parent|sibling|brother|sister|family|sent to|send to|support/.test(lower)) category = "Family Support";
        else if (/salon|barber|haircut|spa|grooming|skincare|beauty|personal care|cosmetics|manicure|pedicure|barbing/.test(lower)) category = "Personal Care";

        const missingFields = [];
        if (!amount) missingFields.push("amount");
        if (category === "Other") missingFields.push("category");

        const description = (text.slice(0, 45) + foreignNote).slice(0, 80);

        return {
            type,
            amount,
            category,
            description,
            date,
            confidence: amount && category !== "Other" ? "medium" : "low",
            missingFields,
        };
    };