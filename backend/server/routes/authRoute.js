const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
    register,
    login,
    getProfile,
    updateProfile,
    changePassword,
    deleteAccount,
} = require("../controllers/authController");
const {
    validate,
    registerValidators,
    loginValidators,
    updateProfileValidators,
    changePasswordValidators,
    deleteAccountValidators,
} = require("../middleware/validators");

// Public routes
router.post("/register", registerValidators, validate, register);
router.post("/login", loginValidators, validate, login);

// Protected routes
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfileValidators, validate, updateProfile);
router.put("/change-password", authMiddleware, changePasswordValidators, validate, changePassword);
router.delete("/account", authMiddleware, deleteAccountValidators, validate, deleteAccount);

module.exports = router;
