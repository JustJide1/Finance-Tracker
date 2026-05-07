const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const { processRecurring } = require("./services/recurringService");

dotenv.config();
connectDB();

const app = express();

app.use(helmet());
app.use(express.json());
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
}));

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
});

const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "AI rate limit reached, please wait a moment." },
});

app.use("/api/auth", authLimiter, require("./routes/authRoute"));
app.use("/api/transactions", require("./routes/transactionRoutes"));
app.use("/api/ai", aiLimiter, require("./routes/aiRoutes"));
app.use("/api/budgets", require("./routes/budgetRoutes"));
app.use("/api/recurring", require("./routes/recurringRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    // Run recurring transactions every hour
    processRecurring(); // Run once at startup
    setInterval(processRecurring, 60 * 60 * 1000); // Every hour
});