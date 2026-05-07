const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
    suggestCategory,
    getInsights,
    checkAnomalies,
    testGemini,
    listModels,
    parseTransaction,
    getForecast,
    getAccuracy,
} = require("../controllers/aiController");
const {
    validate,
    suggestCategoryValidators,
    parseTransactionValidators,
    insightsValidators,
} = require("../middleware/validators");

router.use(authMiddleware);

router.get("/test", testGemini);
router.get("/models", listModels);
router.post("/suggest-category", suggestCategoryValidators, validate, suggestCategory);
router.post("/parse-transaction", parseTransactionValidators, validate, parseTransaction);
router.post("/categorize", suggestCategoryValidators, validate, suggestCategory);
router.get("/insights", insightsValidators, validate, getInsights);
router.get("/anomalies", checkAnomalies);
router.get("/forecast", getForecast);
router.get("/accuracy", getAccuracy);

module.exports = router;
