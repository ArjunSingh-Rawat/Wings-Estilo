const express = require("express");
const {
  sendOtpOnPhone,
  sendOtpOnEmail,
} = require("../controllers/otpController");
const { otpRateLimitMiddleware } = require("../middleware/rateLimit");
const router = express.Router();

router.use("/", otpRateLimitMiddleware());

// router.post("/phone/send-otp", sendOtpOnPhone);

router.post("/email/send-otp", sendOtpOnEmail);

module.exports = router;
