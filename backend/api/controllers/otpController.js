const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/apiError");
const User = require("../models/userModel");
const {
  sendOtpOnNumber,
  sendOtpOnUserEmail,
} = require("../../utils/sendAndVerifyOtp");
const validatePhoneNumber = require("../../utils/validatePhoneNumber");

const sendOtpOnPhone = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userid);
  if (!user) {
    throw new ApiError(404, "User not found!");
  }
  const phoneNumber = req.body.phoneNumber;
  validatePhoneNumber(phoneNumber);

  const userWithSameNumber = await User.findOne({ phoneNumber: +phoneNumber });
  if (!userWithSameNumber) {
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
  } else {
    throw new ApiError(403, "Phone number not available!!");
  }

  res.status(200).json({
    success: true,
    message: "successfully sent otp!",
  });
});

const sendOtpOnEmail = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userid);
  if (!user) {
    throw new ApiError(404, "User not found!");
  }
  const phoneNumber = req.body.phoneNumber;
  validatePhoneNumber(phoneNumber);

  const userWithSameNumber = await User.findOne({ phoneNumber: +phoneNumber });
  if (!userWithSameNumber) {
    await sendOtpOnUserEmail(phoneNumber, user._id, user.email);
  } else {
    throw new ApiError(403, "Phone number not available!!");
  }

  res.status(200).json({
    success: true,
    message: "successfully sent otp!",
  });
});

module.exports = {
  sendOtpOnPhone,
  sendOtpOnEmail,
};
