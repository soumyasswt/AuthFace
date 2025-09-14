const nodemailer = require("nodemailer");
require('dotenv').config(); // ✅ important

console.log("Using email:", process.env.EMAIL_USER);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.sendMail({
  from: process.env.EMAIL_USER,
  to: "yourtestemail@gmail.com",
  subject: "Test OTP",
  text: "This is a test OTP",
}, (err, info) => {
  if (err) console.error("Error sending email:", err);
  else console.log("Email sent:", info.response);
});
