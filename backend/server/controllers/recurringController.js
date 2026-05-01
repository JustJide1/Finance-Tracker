const Recurring = require("../models/Recurring");
const { getNextRun } = require("../services/recurringService");

// Get all recurring rules
exports.getRecurring = async (req, res) => {
    try {
        const recurring = await Recurring.find({ userId: req.user.id })
            .sort({ createdAt: -1 });
        res.json(recurring);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// Create recurring rule
exports.createRecurring = async (req, res) => {
    const { type, amount, category, description, frequency, startDate, endDate } = req.body;

    if (!type || !amount || !category || !description || !frequency || !startDate) {
        return res.status(400).json({ message: "All required fields must be provided" });
    }

    try {
        const recurring = await Recurring.create({
            userId: req.user.id,
            type,
            amount,
            category,
            description,
            frequency,
            startDate,
            endDate: endDate || null,
            nextRun: startDate,
        });
        res.status(201).json(recurring);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// Update recurring rule
exports.updateRecurring = async (req, res) => {
    try {
        const recurring = await Recurring.findOne({
            _id: req.params.id,
            userId: req.user.id,
        });

        if (!recurring) {
            return res.status(404).json({ message: "Recurring rule not found" });
        }

        const { type, amount, category, description, frequency, endDate, isActive } = req.body;

        if (type) recurring.type = type;
        if (amount) recurring.amount = amount;
        if (category) recurring.category = category;
        if (description) recurring.description = description;
        if (frequency) recurring.frequency = frequency;
        if (endDate !== undefined) recurring.endDate = endDate;
        if (isActive !== undefined) recurring.isActive = isActive;

        await recurring.save();
        res.json(recurring);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// Delete recurring rule
exports.deleteRecurring = async (req, res) => {
    try {
        const recurring = await Recurring.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.id,
        });

        if (!recurring) {
            return res.status(404).json({ message: "Recurring rule not found" });
        }

        res.json({ message: "Recurring rule deleted" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// Toggle active status
exports.toggleActive = async (req, res) => {
    try {
        const recurring = await Recurring.findOne({
            _id: req.params.id,
            userId: req.user.id,
        });

        if (!recurring) {
            return res.status(404).json({ message: "Recurring rule not found" });
        }

        recurring.isActive = !recurring.isActive;
        await recurring.save();
        res.json(recurring);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};