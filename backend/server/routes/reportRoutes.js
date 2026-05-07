const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { getAnnualReport } = require("../controllers/reportController");

router.use(authMiddleware);

router.get("/annual", getAnnualReport);

module.exports = router;
