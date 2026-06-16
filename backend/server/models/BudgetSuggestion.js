const mongoose = require("mongoose");

const SuggestionItemSchema = new mongoose.Schema({
    category:       { type: String, required: true },
    currentSpending: { type: Number, required: true },
    suggestedLimit: { type: Number, required: true },
    rationale:      { type: String, required: true },
}, { _id: false });

const BudgetSuggestionSchema = new mongoose.Schema({
    userId:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    suggestions: [SuggestionItemSchema],
    overallTip:  { type: String, default: "" },
    source:      { type: String, enum: ["gemini", "rule-based"], required: true },
    generatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("BudgetSuggestion", BudgetSuggestionSchema);
