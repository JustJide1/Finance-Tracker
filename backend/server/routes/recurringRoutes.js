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

router.use(authMiddleware);

router.get("/", getRecurring);
router.post("/", createRecurring);
router.put("/:id", updateRecurring);
router.patch("/:id/toggle", toggleActive);
router.delete("/:id", deleteRecurring);

module.exports = router;