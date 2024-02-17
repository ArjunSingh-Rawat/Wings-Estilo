const { sendOtpOnNumber } = require("../../utils/sendAndVerifyOtp");

const validatePhoneNumber = require("../../utils/validatePhoneNumber");

const User = require("../models/userModel");

async function sendOtpOnPhone(req, res) {
  try {
    const user = await User.findById(req.user.userid);
    if (!user) {
      throw new Error("User not found!");
    }

    const phoneNumber = req.body.phoneNumber;
    validatePhoneNumber(phoneNumber);

    if (!user.phoneNumber) {
      await sendOtpOnNumber(phoneNumber, req.user.userid, true);
    } else {
      await sendOtpOnNumber(
        phoneNumber,
        req.user.userid,
        false,
        user.phoneNumber
      );
    }

    res.status(200).json({
      success: true,
      message: "successfully sent otp!",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  sendOtpOnPhone,
};
