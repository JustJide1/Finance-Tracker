const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    type: {
        type: String,
        enum: ["income", "expense"],
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    category: {
        type: String,
        enum: require("../../../shared/categories"),
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    date: {
        type: Date,
        required: true,
    },
    aiSuggestedCategory: {
        type: String,
        default: null,
    },
    aiConfidence: {
        type: String,
        enum: ["high", "medium", "low"],
        default: null,
    },
    userOverrode: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

// Compound indexes covering the most common query patterns
TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ userId: 1, type: 1, date: -1 });
TransactionSchema.index({ userId: 1, category: 1 });
TransactionSchema.index({ userId: 1, aiSuggestedCategory: 1, userOverrode: 1 });

module.exports = mongoose.model("Transaction", TransactionSchema);