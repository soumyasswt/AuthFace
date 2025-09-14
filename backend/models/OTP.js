// models/OTP.js
const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});

// TTL index: expires after the expiresAt field
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Optional: Clean up unverified users when OTP expires
otpSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    const User = require("./User");
    const user = await User.findOne({ email: doc.email });
    if (user && !user.verified) {
      await User.deleteOne({ email: doc.email });
      console.log(`Deleted unverified user: ${doc.email}`);
    }
  }
});

module.exports = mongoose.model("OTP", otpSchema);
