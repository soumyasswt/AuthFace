const User = require("../models/User");
const OTP = require("../models/OTP");
const sendOTP = require("../utils/sendEmail");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// ================== HELPERS ==================
const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);
const validatePassword = (password) =>
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);

// ================== SIGNUP ==================
exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log("📥 Signup request:", { name, email });

    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required." });

    if (!validateEmail(email))
      return res.status(400).json({ message: "Invalid email format." });

    if (!validatePassword(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long and include letters, numbers, and a special character.",
      });
    }

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ message: "Account already exists. Please login." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });
    console.log("✅ User created:", user._id);

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpDoc = await OTP.create({
      email,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // OTP valid for 5 minutes
    });
    console.log("✅ OTP stored in DB:", otpDoc);

    // Send OTP email
    await sendOTP(email, otp);

    return res.status(201).json({
      message: "Account created. OTP sent to email for verification.",
    });
  } catch (err) {
    console.error("❌ Signup error:", err);
    return res.status(500).json({ error: "Server error. Please try again later." });
  }
};

// ================== VERIFY OTP ==================
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp)
      return res.status(400).json({ message: "Email and OTP are required." });

    const record = await OTP.findOne({ email, otp });
    if (!record) return res.status(400).json({ message: "Invalid OTP." });

    if (record.expiresAt < Date.now())
      return res.status(400).json({ message: "OTP expired." });

    // Mark user verified
    await User.updateOne({ email }, { verified: true });

    // Remove OTP record
    await OTP.deleteOne({ _id: record._id });

    // Create JWT token after verification
    const user = await User.findOne({ email });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    return res.json({
      message: "OTP verified successfully.",
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("❌ Verify OTP error:", err);
    return res.status(500).json({ error: "Server error." });
  }
};

// ================== LOGIN ==================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required." });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found." });
    if (!user.verified)
      return res.status(401).json({ message: "Account not verified." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Incorrect password." });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    return res.json({
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    return res.status(500).json({ error: "Server error." });
  }
};
