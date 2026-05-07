const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");

exports.getAnnualReport = async (req, res) => {
    try {
        const year = parseInt(req.query.year) || new Date().getFullYear();
        const userId = new mongoose.Types.ObjectId(req.user.id);

        const start = new Date(year, 0, 1);
        const end = new Date(year + 1, 0, 1);

        const [monthlyAgg, categoryAgg] = await Promise.all([
            Transaction.aggregate([
                { $match: { userId, date: { $gte: start, $lt: end } } },
                {
                    $group: {
                        _id: { month: { $month: "$date" }, type: "$type" },
                        total: { $sum: "$amount" },
                        count: { $sum: 1 },
                    },
                },
            ]),
            Transaction.aggregate([
                { $match: { userId, date: { $gte: start, $lt: end }, type: "expense" } },
                { $group: { _id: "$category", total: { $sum: "$amount" } } },
                { $sort: { total: -1 } },
            ]),
        ]);

        const monthNames = [
            "January","February","March","April","May","June",
            "July","August","September","October","November","December",
        ];

        const months = monthNames.map((name, i) => ({
            month: i + 1,
            monthName: name,
            income: 0,
            expenses: 0,
            net: 0,
            count: 0,
        }));

        for (const row of monthlyAgg) {
            const m = row._id.month - 1;
            months[m].count += row.count;
            if (row._id.type === "income") {
                months[m].income += row.total;
            } else {
                months[m].expenses += row.total;
            }
        }

        for (const m of months) {
            m.net = Math.round((m.income - m.expenses) * 100) / 100;
            m.income = Math.round(m.income * 100) / 100;
            m.expenses = Math.round(m.expenses * 100) / 100;
        }

        const totalIncome = months.reduce((s, m) => s + m.income, 0);
        const totalExpenses = months.reduce((s, m) => s + m.expenses, 0);
        const netSavings = Math.round((totalIncome - totalExpenses) * 100) / 100;
        const totalTransactions = months.reduce((s, m) => s + m.count, 0);
        const savingsRate = totalIncome > 0
            ? Math.round(((netSavings / totalIncome) * 100) * 10) / 10
            : 0;

        const topCategories = categoryAgg.map((c) => ({
            category: c._id,
            amount: Math.round(c.total * 100) / 100,
        }));

        res.json({
            year,
            summary: {
                totalIncome: Math.round(totalIncome * 100) / 100,
                totalExpenses: Math.round(totalExpenses * 100) / 100,
                netSavings,
                totalTransactions,
                savingsRate,
            },
            monthly: months,
            topCategories,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};
