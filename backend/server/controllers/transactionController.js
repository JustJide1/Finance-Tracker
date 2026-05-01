const Transaction = require("../models/Transaction");

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

        res.status(201).json(transaction);
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