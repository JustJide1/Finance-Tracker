const mongoose = require("mongoose");

const InsightHistorySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    period: { type: String, required: true },
    insights: { type: [String], required: true },
    generatedAt: { type: Date, default: Date.now },
});

InsightHistorySchema.index({ userId: 1, generatedAt: -1 });

module.exports = mongoose.model("InsightHistory", InsightHistorySchema);
