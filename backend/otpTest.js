require("dotenv").config();
const mongoose = require("mongoose");
const OTP = require("./models/OTP");

const testDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    const otpDoc = await OTP.create({
      email: "testuser@example.com",
      otp: "123456",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    console.log("✅ OTP stored:", otpDoc);
    process.exit(0);
  } catch (err) {
    console.error("❌ OTP store failed:", err);
    process.exit(1);
  }
};

testDB();
