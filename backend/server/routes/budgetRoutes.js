const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
    getBudgets,
    createBudget,
    updateBudget,
    deleteBudget,
} = require("../controllers/budgetController");
const {
    validate,
    createBudgetValidators,
    updateBudgetValidators,
} = require("../middleware/validators");

router.use(authMiddleware);

router.get("/", getBudgets);
router.post("/", createBudgetValidators, validate, createBudget);
router.put("/:id", updateBudgetValidators, validate, updateBudget);
router.delete("/:id", deleteBudget);

module.exports = router;
