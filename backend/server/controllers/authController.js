const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const crypto = require("crypto");

const generateToken = (userId) =>
    jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

// ── Google OAuth ──────────────────────────────────────────────────────────────

const oauthClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
);

const CIPHER_ALGO = "aes-256-cbc";

const encryptToken = (plaintext) => {
    const iv  = crypto.randomBytes(16);
    const key = Buffer.from(process.env.ENCRYPTION_KEY, "hex");
    const cipher = crypto.createCipheriv(CIPHER_ALGO, key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
};

exports.googleAuth = (req, res) => {
    const state = crypto.randomBytes(16).toString("hex");

    const url = oauthClient.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: ["openid", "profile", "email"],
        state,
    });

    // Store state in a short-lived httpOnly cookie for CSRF validation on callback
    res.cookie("oauth_state", state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",        // must be 'lax' — Google redirect strips 'strict' cookies
        maxAge: 10 * 60 * 1000, // 10 minutes
    });

    res.redirect(url);
};

exports.googleCallback = async (req, res) => {
    const { code, state } = req.query;
    const storedState = req.cookies?.oauth_state;

    if (!state || state !== storedState) {
        return res.redirect(`${process.env.CLIENT_URL}/?error=invalid_state`);
    }
    res.clearCookie("oauth_state");

    try {
        const { tokens } = await oauthClient.getToken(code);

        const ticket = await oauthClient.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const { sub: googleId, email, name, picture } = ticket.getPayload();

        const parts = (name || "").trim().split(/\s+/);
        const firstName = parts[0] || "";
        const lastName  = parts.slice(1).join(" ") || "";

        // Link to existing account by googleId, or fall back to matching email
        let user = await User.findOne({ $or: [{ googleId }, { email }] });
        if (user) {
            user.googleId = googleId;
            user.avatar   = picture;
        } else {
            user = new User({ googleId, email, firstName, lastName, avatar: picture, provider: "google" });
        }

        // Encrypt and persist refresh token when Google issues one
        if (tokens.refresh_token && process.env.ENCRYPTION_KEY) {
            user.googleRefreshToken = encryptToken(tokens.refresh_token);
        }

        await user.save();

        const token = generateToken(user._id);
        const redirectParams = new URLSearchParams({
            token,
            id:        user._id.toString(),
            firstName: user.firstName || firstName,
            email:     user.email,
            avatar:    picture || "",
        });

        res.redirect(`${process.env.CLIENT_URL}/auth/callback?${redirectParams}`);
    } catch (err) {
        console.error("[googleCallback]", err);
        res.redirect(`${process.env.CLIENT_URL}/?error=oauth_failed`);
    }
};

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