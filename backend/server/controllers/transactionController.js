const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const Budget = require("../models/Budget");
const CategoryCorrection = require("../models/CategoryCorrection");
const { invalidate: invalidateCorrectionCache } = require("../utils/correctionCache");

// Get transactions — supports ?type=expense|income &category= &search= &startDate= &endDate= &page= &limit=
exports.getTransactions = async (req, res) => {
    try {
        const { type, category, startDate, endDate, search, page = 1, limit = 50 } = req.query;

        const filter = { userId: req.user.id };
        if (type)     filter.type     = type;
        if (category) filter.category = category;
        if (search)   filter.description = { $regex: search, $options: "i" };
        if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = new Date(startDate);
            if (endDate)   filter.date.$lte = new Date(endDate);
        }

        const pageNum  = Math.max(1, parseInt(page)  || 1);
        const pageSize = Math.min(200, Math.max(1, parseInt(limit) || 50));

        const [transactions, total] = await Promise.all([
            Transaction.find(filter)
                .sort({ date: -1 })
                .skip((pageNum - 1) * pageSize)
                .limit(pageSize)
                .lean(),
            Transaction.countDocuments(filter),
        ]);

        res.json({
            transactions,
            pagination: { page: pageNum, limit: pageSize, total, pages: Math.ceil(total / pageSize) },
        });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// Get single transaction
exports.getTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findOne({
            _id: req.params.id,
            userId: req.user.id,
        });
        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }
        res.json(transaction);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// Create transaction
exports.createTransaction = async (req, res) => {
    const { type, amount, category, description, date } = req.body;

    try {
        // Validation
        if (!type || !amount || !category || !description || !date) {
            return res.status(400).json({ message: "All fields are required" });
        }
        if (!["income", "expense"].includes(type)) {
            return res.status(400).json({ message: "Type must be income or expense" });
        }
        if (amount <= 0) {
            return res.status(400).json({ message: "Amount must be greater than 0" });
        }

        const transaction = await Transaction.create({
            userId: req.user.id,
            type,
            amount,
            category,
            description,
            date,
        });

        let budgetAlert = null;
        if (type === "expense") {
            const budget = await Budget.findOne({ userId: req.user.id, category });
            if (budget) {
                const now = new Date();
                let periodStart;
                if (budget.period === "weekly") {
                    const daysFromMonday = now.getDay() === 0 ? 6 : now.getDay() - 1;
                    periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysFromMonday);
                } else {
                    periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
                }

                const [agg] = await Transaction.aggregate([
                    { $match: { userId: transaction.userId, type: "expense", category, date: { $gte: periodStart } } },
                    { $group: { _id: null, total: { $sum: "$amount" } } },
                ]);
                const totalSpent = agg?.total ?? 0;
                const pct = (totalSpent / budget.amount) * 100;

                if (pct >= 100) {
                    budgetAlert = {
                        level: "exceeded",
                        category,
                        spent: totalSpent,
                        budget: budget.amount,
                        percentage: Math.round(pct),
                        period: budget.period,
                        message: `Budget exceeded! You've spent ₦${totalSpent.toLocaleString()} of your ₦${budget.amount.toLocaleString()} ${budget.period} ${category} budget.`,
                    };
                } else if (pct >= 80) {
                    budgetAlert = {
                        level: "warning",
                        category,
                        spent: totalSpent,
                        budget: budget.amount,
                        percentage: Math.round(pct),
                        period: budget.period,
                        message: `Budget alert! You've used ${Math.round(pct)}% of your ₦${budget.amount.toLocaleString()} ${budget.period} ${category} budget.`,
                    };
                }
            }
        }

        const responseData = transaction.toObject();
        if (budgetAlert) responseData.budgetAlert = budgetAlert;
        res.status(201).json(responseData);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// Update transaction
exports.updateTransaction = async (req, res) => {
    const { type, amount, category, description, date } = req.body;

    try {
        const transaction = await Transaction.findOne({
            _id: req.params.id,
            userId: req.user.id,
        });

        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        // Validation
        if (type && !["income", "expense"].includes(type)) {
            return res.status(400).json({ message: "Type must be income or expense" });
        }
        if (amount && amount <= 0) {
            return res.status(400).json({ message: "Amount must be greater than 0" });
        }

        // Log category correction when user changes AI-suggested category
        if (category && category !== transaction.category && transaction.aiSuggestedCategory) {
            const effectiveOriginal = transaction.aiSuggestedCategory;
            if (category !== effectiveOriginal) {
                transaction.userOverrode = true;
                await CategoryCorrection.create({
                    userId: req.user.id,
                    transactionId: transaction._id,
                    description: transaction.description,
                    originalCategory: effectiveOriginal,
                    correctedCategory: category,
                });
                invalidateCorrectionCache(req.user.id);
            }
        }

        transaction.type = type || transaction.type;
        transaction.amount = amount || transaction.amount;
        transaction.category = category || transaction.category;
        transaction.description = description || transaction.description;
        transaction.date = date || transaction.date;

        await transaction.save();
        res.json(transaction);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// Delete transaction
exports.deleteTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.id,
        });

        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        res.json({ message: "Transaction deleted" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// Delete ALL expense transactions for the logged-in user
exports.deleteAllExpenses = async (req, res) => {
    try {
        const result = await Transaction.deleteMany({
            userId: req.user.id,
            type: "expense",
        });
        res.json({ message: "All expenses deleted", deletedCount: result.deletedCount });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// Delete ALL income transactions for the logged-in user
exports.deleteAllIncome = async (req, res) => {
    try {
        const result = await Transaction.deleteMany({
            userId: req.user.id,
            type: "income",
        });
        res.json({ message: "All income deleted", deletedCount: result.deletedCount });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// Get summary stats via aggregation — no full document load
exports.getStats = async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const userId = new mongoose.Types.ObjectId(req.user.id);

        const [agg] = await Transaction.aggregate([
            { $match: { userId } },
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
                }
            }
        ]);

        const totalIncome    = agg?.totalIncome     ?? 0;
        const totalExpenses  = agg?.totalExpenses   ?? 0;
        const monthlyExpenses = agg?.monthlyExpenses ?? 0;

        res.json({ balance: totalIncome - totalExpenses, totalIncome, totalExpenses, monthlyExpenses });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};