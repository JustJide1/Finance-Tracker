const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const { processRecurring } = require("./services/recurringService");

dotenv.config();
connectDB();

const app = express();

// ── Process-level safety nets ─────────────────────────────────────────────────
// Unhandled promise rejections: log and keep running (the rejection is isolated
// to the request that triggered it, so crashing the process is disproportionate).
process.on("unhandledRejection", (reason) => {
    console.error("[unhandledRejection]", reason);
});

// Uncaught synchronous exceptions leave the process in an undefined state —
// crash immediately so a process supervisor (PM2, Docker restart policy) can
// bring up a clean instance.
process.on("uncaughtException", (err) => {
    console.error("[uncaughtException]", err);
    process.exit(1);
});

// ── Core middleware ───────────────────────────────────────────────────────────
app.use(helmet());
app.use(express.json());
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
}));

// ── Rate limiters ─────────────────────────────────────────────────────────────

// Auth endpoints: tighter window to slow credential-stuffing.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
});

// Global AI guard — coarse DDoS protection before the request reaches the
// per-user heavyAiLimiter defined inside aiRoutes.js.
// Keeps the total Gemini call rate well below the free-tier ceiling even if
// many unauthenticated (or just very rapid) requests arrive.
const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,            // 60 requests/minute total across all users — generous ceiling
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "AI rate limit reached, please wait a moment." },
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth",        authLimiter, require("./routes/authRoute"));
app.use("/api/dashboard",                require("./routes/dashboardRoutes"));
app.use("/api/transactions",             require("./routes/transactionRoutes"));
app.use("/api/ai",          aiLimiter,   require("./routes/aiRoutes"));
app.use("/api/budgets",                  require("./routes/budgetRoutes"));
app.use("/api/recurring",               require("./routes/recurringRoutes"));
app.use("/api/reports",                  require("./routes/reportRoutes"));

// ── Global Express error handler ──────────────────────────────────────────────
// Catches synchronous throws from any middleware/route handler that calls next(err)
// or throws inside an Express-wrapped async handler.
// Without this, Express logs the error but leaves the response open (memory leak).
// MUST be the last app.use() call — Express identifies it by the 4-argument signature.
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
    console.error("[Express error]", err);
    if (res.headersSent) return; // response already started — can't send error JSON
    res.status(err.status ?? 500).json({
        message: err.message ?? "Internal server error",
    });
});

// ── Server startup ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    // Run recurring transactions every hour
    processRecurring().catch(err => console.error("[recurringService startup]", err));
    const recurringInterval = setInterval(
        () => processRecurring().catch(err => console.error("[recurringService interval]", err)),
        60 * 60 * 1000,
    );

    async function shutdown(signal) {
        console.log(`${signal} received — shutting down gracefully`);
        clearInterval(recurringInterval);
        await mongoose.connection.close();
        process.exit(0);
    }

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT",  () => shutdown("SIGINT"));
});
