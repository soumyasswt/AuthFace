// utils/sendEmail.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendOTP(to, otp) {
  try {
    const mailOptions = {
      from: `"SAS App" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Your OTP Code",
      text: `Your OTP is: ${otp}. It will expire in 5 minutes.`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ OTP email sent to:", to, info.response);
  } catch (err) {
    console.error("❌ Email sending failed:", err.message);
    throw new Error("Failed to send OTP email");
  }
}

module.exports = sendOTP;
