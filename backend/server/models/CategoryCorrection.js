const mongoose = require("mongoose");

const CategoryCorrectionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },
    description: { type: String, required: true },
    originalCategory: { type: String, required: true },
    correctedCategory: { type: String, required: true },
}, { timestamps: true });

// Fast per-user lookup sorted newest-first (used for few-shot examples)
CategoryCorrectionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("CategoryCorrection", CategoryCorrectionSchema);
