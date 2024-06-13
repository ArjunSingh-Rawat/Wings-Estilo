const express = require("express");
const {
  sendOtpOnPhone,
  sendOtpOnEmail,
} = require("../controllers/otpController");
const router = express.Router();

router.post("/phone/send-otp", sendOtpOnPhone);

router.post("/email/send-otp", sendOtpOnEmail);

module.exports = router;
