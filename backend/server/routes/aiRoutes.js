const express    = require("express");
const rateLimit  = require("express-rate-limit");
const router     = express.Router();
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
    getAIDashboard,
} = require("../controllers/aiController");
const {
    validate,
    suggestCategoryValidators,
    parseTransactionValidators,
    insightsValidators,
} = require("../middleware/validators");

// Auth runs first on every route in this router so req.user is available for keyGenerator below.
router.use(authMiddleware);

// Per-user limiter for heavyweight AI endpoints (insights, forecast, anomalies, dashboard).
// These each trigger 1-3 Gemini calls. keyGenerator is per-user (not per-IP) because
// the 24-hour Insight cache makes repeat hits cheap — the limit is for cold-cache bursts.
// 3 requests/minute per user is generous: results are cached for 24 h so one real call/day
// is the normal pattern; 3/min handles legitimate retries and period changes.
const heavyAiLimiter = rateLimit({
    windowMs:       60 * 1_000,
    max:            3,
    standardHeaders: true,
    legacyHeaders:  false,
    keyGenerator:   (req) => req.user.id,   // req.user set by authMiddleware above
    message: {
        error: "Too many AI requests. Insight results are cached for 24 hours — try again in a minute.",
    },
    skip: (req) => process.env.NODE_ENV === "test",
});

// Light limiter for single-call AI endpoints (category suggestion, parse).
// These are invoked on every QuickAdd submission so the limit is higher.
const lightAiLimiter = rateLimit({
    windowMs:       60 * 1_000,
    max:            20,
    standardHeaders: true,
    legacyHeaders:  false,
    keyGenerator:   (req) => req.user.id,
    message: {
        error: "Too many categorization requests. Please wait a moment.",
    },
    skip: (req) => process.env.NODE_ENV === "test",
});

// ── Routes ────────────────────────────────────────────────────────────────────

// Debug / admin (no extra rate limit — already behind global aiLimiter in index.js)
router.get("/test",   testGemini);
router.get("/models", listModels);

// Light AI endpoints — one Gemini call each
router.post("/suggest-category", lightAiLimiter, suggestCategoryValidators, validate, suggestCategory);
router.post("/parse-transaction", lightAiLimiter, parseTransactionValidators, validate, parseTransaction);
router.post("/categorize",        lightAiLimiter, suggestCategoryValidators, validate, suggestCategory);

// Heavy AI endpoints — up to 3 Gemini calls, MongoDB aggregations, 24h cached
router.get("/insights",  heavyAiLimiter, insightsValidators, validate, getInsights);
router.get("/anomalies", heavyAiLimiter, checkAnomalies);
router.get("/forecast",  heavyAiLimiter, getForecast);
router.get("/dashboard", heavyAiLimiter, getAIDashboard);

// No extra per-user limit: accuracy just reads DB, no Gemini call
router.get("/accuracy", getAccuracy);

module.exports = router;
