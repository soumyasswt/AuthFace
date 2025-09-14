const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Routes
router.post("/signup", authController.signup);
router.post("/verify-otp", authController.verifyOtp);
router.post("/login", authController.login);

module.exports = router;
