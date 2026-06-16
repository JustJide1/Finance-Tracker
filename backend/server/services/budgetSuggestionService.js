"use strict";

const Transaction = require("../models/Transaction");
const Budget      = require("../models/Budget");
const CATEGORIES  = require("../../../shared/categories");
const { generate } = require("../utils/geminiLimiter");

// ── Data aggregation ──────────────────────────────────────────────────────────

/**
 * Returns per-category spending summary for the last `months` calendar months,
 * plus each category's existing budget limit (if set).
 *
 * @returns {{
 *   spendingSummary: Array<{category,totalSpent,monthlyAverage,transactionCount}>,
 *   existingBudgets: Map<string, number>
 * }}
 */
async function getCategorySpendingSummary(userId, months = 3) {
    const since = new Date();
    since.setMonth(since.getMonth() - months);
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    const [transactions, budgets] = await Promise.all([
        Transaction.find({ userId, type: "expense", date: { $gte: since } })
            .select("category amount date")
            .lean(),
        Budget.find({ userId }).select("category amount").lean(),
    ]);

    const existingBudgets = new Map(budgets.map(b => [b.category, b.amount]));

    const byCat = {};
    for (const t of transactions) {
        if (!byCat[t.category]) byCat[t.category] = { totalSpent: 0, transactionCount: 0 };
        byCat[t.category].totalSpent      += t.amount;
        byCat[t.category].transactionCount += 1;
    }

    const spendingSummary = Object.entries(byCat).map(([category, data]) => ({
        category,
        totalSpent:       Math.round(data.totalSpent),
        monthlyAverage:   Math.round(data.totalSpent / months),
        transactionCount: data.transactionCount,
    }));

    spendingSummary.sort((a, b) => b.totalSpent - a.totalSpent);

    return { spendingSummary, existingBudgets };
}

// ── Rule-based fallback ───────────────────────────────────────────────────────

function roundTo500(n) {
    return Math.round(n / 500) * 500;
}

function getRuleBasedBudgetSuggestions(spendingSummary) {
    const suggestions = spendingSummary.map(({ category, monthlyAverage }) => ({
        category,
        currentSpending: monthlyAverage,
        suggestedLimit:  Math.max(500, roundTo500(monthlyAverage * 1.1)),
        rationale:       `Based on your average monthly spending of ₦${monthlyAverage.toLocaleString()}, a 10% buffer keeps you covered without overspending.`,
    }));

    return {
        suggestions,
        overallTip: "Track your spending weekly to stay within these limits and adjust as your income or needs change.",
    };
}

// ── Gemini-based suggestions ──────────────────────────────────────────────────

async function getAIBudgetSuggestions(userId, spendingSummary, existingBudgets) {
    const lines = spendingSummary.map(s => {
        const existing = existingBudgets.get(s.category);
        const budgetNote = existing ? ` (current budget limit: ₦${existing.toLocaleString()})` : " (no budget set)";
        return `- ${s.category}: monthly avg ₦${s.monthlyAverage.toLocaleString()}, total over 3 months ₦${s.totalSpent.toLocaleString()}${budgetNote}`;
    }).join("\n");

    const validCatList = CATEGORIES.filter(c => !["Income", "Salary"].includes(c)).join(", ");

    const prompt = `You are a Nigerian personal-finance assistant helping a university student manage their money in Naira (₦).

The user's spending over the last 3 months:
${lines}

Based on this data, suggest a realistic monthly budget limit for each category listed above.

Rules:
- Only suggest limits for the EXACT category names listed above (do not invent new ones).
- Suggest a limit that is practical and slightly above their average so they are not constantly over budget.
- Rationale must be one sentence, in Nigerian context (mention POS charges, data bundles, transport hikes, etc. where relevant).
- Return ONLY strict JSON — no markdown fences, no preamble.

Required JSON shape:
{
  "suggestions": [
    {
      "category": "<exact category name from the list above>",
      "currentSpending": <monthly average as integer>,
      "suggestedLimit": <suggested monthly limit as integer, rounded to nearest 500>,
      "rationale": "<one sentence explanation>"
    }
  ],
  "overallTip": "<one short sentence of general budgeting advice for this user>"
}`;

    const result = await generate(prompt);
    let raw = result.response.text().trim();

    // Strip any accidental markdown fences
    raw = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

    const parsed = JSON.parse(raw);

    // Validate and filter suggestions — only keep categories from shared/categories.js
    const validSet = new Set(CATEGORIES);
    const cleaned = (parsed.suggestions || []).filter(s => validSet.has(s.category));

    return {
        suggestions: cleaned.map(s => ({
            category:        s.category,
            currentSpending: Math.round(Number(s.currentSpending)) || 0,
            suggestedLimit:  Math.max(500, roundTo500(Number(s.suggestedLimit))),
            rationale:       String(s.rationale || "").slice(0, 300),
        })),
        overallTip: String(parsed.overallTip || "").slice(0, 400),
    };
}

module.exports = { getCategorySpendingSummary, getRuleBasedBudgetSuggestions, getAIBudgetSuggestions };
