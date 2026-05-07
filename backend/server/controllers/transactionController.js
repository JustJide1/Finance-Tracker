const Transaction = require("../models/Transaction");
const Budget = require("../models/Budget");
const CategoryCorrection = require("../models/CategoryCorrection");

// Get all transactions for logged-in user
exports.getTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.user.id })
            .sort({ date: -1 });
        res.json(transactions);
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
    console.log("Raw body received:", req.body);
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

// Get summary stats
exports.getStats = async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.user.id });

        const totalIncome = transactions
            .filter(t => t.type === "income")
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpenses = transactions
            .filter(t => t.type === "expense")
            .reduce((sum, t) => sum + t.amount, 0);

        const balance = totalIncome - totalExpenses;

        // Monthly expenses (current month)
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthlyExpenses = transactions
            .filter(t => t.type === "expense" && new Date(t.date) >= startOfMonth)
            .reduce((sum, t) => sum + t.amount, 0);

        res.json({
            balance,
            totalIncome,
            totalExpenses,
            monthlyExpenses,
        });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};