const mongoose = require("mongoose");

const InsightSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    period: { type: String, default: "month" },
    insights: [{ type: String }],
    generatedAt: { type: Date, default: Date.now },
});

InsightSchema.index({ userId: 1, period: 1 }, { unique: true });

module.exports = mongoose.model("Insight", InsightSchema);
