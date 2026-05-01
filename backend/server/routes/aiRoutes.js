const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { suggestCategory, getInsights, checkAnomalies, testGemini, listModels, parseTransaction } = require("../controllers/aiController");



router.use(authMiddleware);

router.get("/test", testGemini);
router.get("/models", listModels);
router.post("/suggest-category", suggestCategory);
router.post("/parse-transaction", parseTransaction);
router.post("/categorize", suggestCategory);
router.get("/insights", getInsights);
router.get("/anomalies", checkAnomalies);

module.exports = router;