const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const { processRecurring } = require("./services/recurringService");

dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use(cors());

app.use("/api/auth", require("./routes/authRoute"));
app.use("/api/transactions", require("./routes/transactionRoutes"));
app.use("/api/ai", require("./routes/aiRoutes"));
app.use("/api/budgets", require("./routes/budgetRoutes"));
app.use("/api/recurring", require("./routes/recurringRoutes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    // Run recurring transactions every hour
    processRecurring(); // Run once at startup
    setInterval(processRecurring, 60 * 60 * 1000); // Every hour
});