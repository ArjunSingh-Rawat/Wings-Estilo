const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  emailOtp: {
    type: String,
  },
  eOtpCreatedAt: {
    type: Date,
  },
  phoneNumber: {
    type: Number,
  },
  primaryPhoneNumberOtp: {
    type: String,
  },
  phoneNumberOtp: {
    type: String,
  },
  priPnOtpCreatedAt: {
    type: Date,
  },
  pnOtpCreatedAt: {
    type: Date,
  },
});

module.exports = mongoose.model("Otp", otpSchema);
