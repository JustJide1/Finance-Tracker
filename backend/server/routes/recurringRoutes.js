const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
    getRecurring,
    createRecurring,
    updateRecurring,
    deleteRecurring,
    toggleActive,
} = require("../controllers/recurringController");
const {
    validate,
    createRecurringValidators,
    updateRecurringValidators,
} = require("../middleware/validators");

router.use(authMiddleware);

router.get("/", getRecurring);
router.post("/", createRecurringValidators, validate, createRecurring);
router.put("/:id", updateRecurringValidators, validate, updateRecurring);
router.patch("/:id/toggle", toggleActive);
router.delete("/:id", deleteRecurring);

module.exports = router;
