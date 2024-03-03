const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/apiError");
const User = require("../models/userModel");
const { sendOtpOnNumber } = require("../../utils/sendAndVerifyOtp");
const validatePhoneNumber = require("../../utils/validatePhoneNumber");

const sendOtpOnPhone = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userid);
  if (!user) {
    throw new ApiError(404, "User not found!");
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
});

module.exports = {
  sendOtpOnPhone,
};
