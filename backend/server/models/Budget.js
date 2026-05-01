const mongoose = require("mongoose");

const BudgetSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    category: {
        type: String,
        required: true,
        trim: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    period: {
        type: String,
        enum: ["monthly", "weekly"],
        default: "monthly",
    },
}, { timestamps: true });

// Prevent duplicate budgets for same category per user
BudgetSchema.index({ userId: 1, category: 1 }, { unique: true });

module.exports = mongoose.model("Budget", BudgetSchema);