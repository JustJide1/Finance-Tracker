const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
    getTransactions,
    getTransaction,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    getStats,
    deleteAllExpenses,
    deleteAllIncome,
} = require("../controllers/transactionController");
const {
    validate,
    createTransactionValidators,
    updateTransactionValidators,
} = require("../middleware/validators");

// All routes require authentication
router.use(authMiddleware);

router.get("/", getTransactions);
router.get("/stats", getStats);
router.delete("/expenses/all", deleteAllExpenses);
router.delete("/income/all", deleteAllIncome);
router.get("/:id", getTransaction);
router.post("/", createTransactionValidators, validate, createTransaction);
router.put("/:id", updateTransactionValidators, validate, updateTransaction);
router.delete("/:id", deleteTransaction);

module.exports = router;
