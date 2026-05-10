const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");

// GET /api/dashboard
// Returns pre-computed stats (via aggregation) + last 13 months of transactions in one round-trip.
// 13 months covers all charts (12-month overview, 8-month sparkline, current week)
// and both expense-badge comparisons without loading the full transaction history.
exports.getDashboard = async (req, res) => {
    try {
        const userId    = req.user.id;
        const userObjId = new mongoose.Types.ObjectId(userId);
        const now       = new Date();
        const startOfMonth   = new Date(now.getFullYear(), now.getMonth(), 1);
        const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const chartWindow    = new Date(now.getFullYear(), now.getMonth() - 13, 1);

        const [transactions, [statsAgg]] = await Promise.all([
            // Bounded fetch — avoids loading years of data on every page load
            Transaction.find({ userId, date: { $gte: chartWindow } })
                .sort({ date: -1 })
                .lean(),

            Transaction.aggregate([
                { $match: { userId: userObjId } },
                {
                    $group: {
                        _id: null,
                        totalIncome: {
                            $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] }
                        },
                        totalExpenses: {
                            $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] }
                        },
                        monthlyExpenses: {
                            $sum: {
                                $cond: [
                                    { $and: [{ $eq: ["$type", "expense"] }, { $gte: ["$date", startOfMonth] }] },
                                    "$amount", 0
                                ]
                            }
                        },
                        // Previous month expenses — used for the expense-change badge
                        prevMonthExpenses: {
                            $sum: {
                                $cond: [
                                    {
                                        $and: [
                                            { $eq:  ["$type", "expense"] },
                                            { $gte: ["$date", prevMonthStart] },
                                            { $lt:  ["$date", startOfMonth] },
                                        ]
                                    },
                                    "$amount", 0
                                ]
                            }
                        },
                        // Net balance up to (but not including) the current month — used for the balance-change badge
                        balanceAtMonthStart: {
                            $sum: {
                                $cond: [
                                    { $lt: ["$date", startOfMonth] },
                                    {
                                        $cond: [
                                            { $eq: ["$type", "income"] },
                                            "$amount",
                                            { $multiply: ["$amount", -1] }
                                        ]
                                    },
                                    0
                                ]
                            }
                        },
                    }
                }
            ])
        ]);

        const totalIncome         = statsAgg?.totalIncome         ?? 0;
        const totalExpenses       = statsAgg?.totalExpenses       ?? 0;
        const monthlyExpenses     = statsAgg?.monthlyExpenses     ?? 0;
        const prevMonthExpenses   = statsAgg?.prevMonthExpenses   ?? 0;
        const balanceAtMonthStart = statsAgg?.balanceAtMonthStart ?? 0;
        const balance             = totalIncome - totalExpenses;

        // Compute badges server-side so the client never needs all-time transaction data
        const pct = prevMonthExpenses === 0
            ? null
            : +((monthlyExpenses - prevMonthExpenses) / prevMonthExpenses * 100).toFixed(1);

        const balancePct = balanceAtMonthStart === 0
            ? null
            : +((balance - balanceAtMonthStart) / Math.abs(balanceAtMonthStart) * 100).toFixed(1);

        res.json({
            stats: { balance, totalIncome, totalExpenses, monthlyExpenses, pct, balancePct },
            transactions,
        });
    } catch (err) {
        console.error("Dashboard error:", err);
        res.status(500).json({ message: "Server error" });
    }
};
