const Budget = require("../models/Budget");
const Transaction = require("../models/Transaction");

// Get all budgets with current spending
exports.getBudgets = async (req, res) => {
    try {
        const budgets = await Budget.find({ userId: req.user.id });

        // Calculate spending per budget
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const transactions = await Transaction.find({
            userId: req.user.id,
            type: "expense",
        });

        const budgetsWithProgress = budgets.map(budget => {
            const startDate = budget.period === "weekly" ? startOfWeek : startOfMonth;

            const spent = transactions
                .filter(t => t.category === budget.category && new Date(t.date) >= startDate)
                .reduce((sum, t) => sum + t.amount, 0);

            const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

            let status = "safe";
            if (percentage >= 100) status = "exceeded";
            else if (percentage >= 80) status = "warning";
            else if (percentage >= 50) status = "moderate";

            return {
                _id: budget._id,
                category: budget.category,
                amount: budget.amount,
                period: budget.period,
                spent,
                remaining: Math.max(0, budget.amount - spent),
                percentage: Math.min(100, percentage),
                status,
            };
        });

        res.json(budgetsWithProgress);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// Create budget
exports.createBudget = async (req, res) => {
    const { category, amount, period } = req.body;

    if (!category || !amount) {
        return res.status(400).json({ message: "Category and amount are required" });
    }
    if (amount <= 0) {
        return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    try {
        const exists = await Budget.findOne({ userId: req.user.id, category });
        if (exists) {
            return res.status(400).json({ message: `Budget for ${category} already exists` });
        }

        const budget = await Budget.create({
            userId: req.user.id,
            category,
            amount,
            period: period || "monthly",
        });

        res.status(201).json(budget);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// Update budget
exports.updateBudget = async (req, res) => {
    const { amount, period } = req.body;

    try {
        const budget = await Budget.findOne({
            _id: req.params.id,
            userId: req.user.id,
        });

        if (!budget) {
            return res.status(404).json({ message: "Budget not found" });
        }

        if (amount && amount <= 0) {
            return res.status(400).json({ message: "Amount must be greater than 0" });
        }

        budget.amount = amount || budget.amount;
        budget.period = period || budget.period;

        await budget.save();
        res.json(budget);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// Delete budget
exports.deleteBudget = async (req, res) => {
    try {
        const budget = await Budget.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.id,
        });

        if (!budget) {
            return res.status(404).json({ message: "Budget not found" });
        }

        res.json({ message: "Budget deleted" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};