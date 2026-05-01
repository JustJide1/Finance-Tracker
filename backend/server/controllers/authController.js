const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const generateToken = (userId) =>
    jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

exports.register = async (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    try {
        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ message: "Email already in use" });

        const hashed = await bcrypt.hash(password, 12);
        const user = await User.create({ firstName, lastName, email, password: hashed });

        res.status(201).json({
            token: generateToken(user._id),
            user: { id: user._id, firstName: user.firstName, email: user.email },
        });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid credentials" });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ message: "Invalid credentials" });

        res.json({
            token: generateToken(user._id),
            user: { id: user._id, firstName: user.firstName, email: user.email },
        });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// Get current user profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// Update profile (name, email)
exports.updateProfile = async (req, res) => {
    const { firstName, lastName, email } = req.body;

    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Check if new email is taken (by someone else)
        if (email && email !== user.email) {
            const exists = await User.findOne({ email });
            if (exists) return res.status(400).json({ message: "Email already in use" });
        }

        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;
        user.email = email || user.email;

        await user.save();

        res.json({
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
            },
        });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// Change password
exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Both passwords are required" });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ message: "New password must be at least 8 characters" });
    }

    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) return res.status(400).json({ message: "Current password is incorrect" });

        user.password = await bcrypt.hash(newPassword, 12);
        await user.save();

        res.json({ message: "Password changed successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// Delete account
exports.deleteAccount = async (req, res) => {
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ message: "Password is required to delete account" });
    }

    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ message: "Incorrect password" });

        // Delete all user transactions first
        const Transaction = require("../models/Transaction");
        await Transaction.deleteMany({ userId: req.user.id });

        // Delete the user
        await User.findByIdAndDelete(req.user.id);

        res.json({ message: "Account deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};