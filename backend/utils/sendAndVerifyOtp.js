const otpGenerator = require("./otpGenerator");
const Otp = require("../api/models/otpModel");

const client = require("twilio")(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function sendOtpOnNumber(
  phoneNumber,
  userId,
  primary,
  primaryPhoneNumber
) {
  try {
    const primaryOtp = otpGenerator();
    const otp = otpGenerator();

    if (primary) {
      await Otp.findOneAndUpdate(
        { user: userId },
        {
          primaryPhoneNumberOtp: primaryOtp,
          priPnOtpCreatedAt: Date.now(),
          phoneNumber,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      const message = `You are one step away from adding you first number\nYour verification OTP:${primaryOtp}`;
      await sendTwilioMessage(message, phoneNumber);
    } else {
      await Otp.findOneAndUpdate(
        { user: userId },
        {
          primaryPhoneNumberOtp: primaryOtp,
          priPnOtpCreatedAt: Date.now(),
          phoneNumberOtp: otp,
          pnOtpCreatedAt: Date.now(),
          phoneNumber,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      const messageForPrimaryNumber = `If you are attempting to update your mobile number\nUse code ${primaryOtp} to verify on wingsestilo.in\nValid for 2 minutes`;
      const messageForUpdateNumber = `Your are one step away from updating number\nUse code ${otp} to update mobile number\nValid for 3 minutes`;

      await sendTwilioMessage(messageForPrimaryNumber, primaryPhoneNumber);
      await sendTwilioMessage(messageForUpdateNumber, phoneNumber);
    }
  } catch (error) {
    throw error;
  }
}

async function sendTwilioMessage(message, phoneNumber) {
  const messageObj = await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: "+91" + phoneNumber,
  });
}

async function verifyPhoneOtp(otp, userId, phoneNumber, primary) {
  try {
    if (!otp) {
      throw new Error("Otp not found!");
    }

    const otpData = await Otp.findOne({ user: userId });

    if (!otpData) {
      throw new Error("no otp data found!");
    }

    if (phoneNumber && +phoneNumber !== otpData.phoneNumber) {
      throw new Error("Phone number provided is not correct!");
    }

    if (primary) {
      const dbOtp = otpData.primaryPhoneNumberOtp;

      if (otp !== dbOtp) {
        throw new Error("Wrong primary otp provided!");
      }
      const currentTime = new Date().getTime();
      const timeDifference =
        currentTime - new Date(otpData.priPnOtpCreatedAt).getTime();
      const timeDifferenceInMinute = timeDifference / 1000 / 60;

      if (timeDifferenceInMinute > 2) {
        throw new Error("Primary otp Expired!!!");
      }
    } else {
      const dbOtp = otpData.phoneNumberOtp;

      if (otp !== dbOtp) {
        throw new Error("Wrong otp provided!");
      }
      const currentTime = new Date().getTime();
      const timeDifference =
        currentTime - new Date(otpData.pnOtpCreatedAt).getTime();
      const timeDifferenceInMinute = timeDifference / 1000 / 60;

      if (timeDifferenceInMinute > 3) {
        throw new Error("OTP Expired!!!");
      }
    }
  } catch (error) {
    throw error;
  }
}

module.exports = { sendOtpOnNumber, verifyPhoneOtp };
