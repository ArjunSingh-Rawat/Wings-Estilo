const express = require("express");
const { sendOtpOnPhone } = require("../controllers/otpController");
const router = express.Router();

router.post("/phone/send-otp", sendOtpOnPhone);

module.exports = router;
