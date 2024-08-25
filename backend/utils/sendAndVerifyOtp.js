const otpGenerator = require("./otpGenerator");
const Otp = require("../api/models/otpModel");
const twilio = require("twilio");
const nodemailer = require("nodemailer");
const ApiError = require("./apiError");
const fs = require("fs");
const path = require("path");
const ejs = require("ejs");

let client = "";
try {
  client = new twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
} catch (error) {
  console.log(
    "****** Twilio Error ******\n",
    "\tOTP verification will not work: twilio account id or twilio auth token is not present!!\n" +
      "*************"
  );
}

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

      if (!client) {
        throw new ApiError(
          406,
          "Cannot send OTP due to invalid twilio sms credentials!"
        );
      }

      const message = `You are one step away from adding you first number\nYour verification OTP:${primaryOtp}`;
      if (client) {
        // await sendTwilioMessage(message, phoneNumber);
      }
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

      if (!client) {
        throw new ApiError(
          406,
          "Cannot send OTP due to invalid twilio sms credentials!"
        );
      }

      const messageForPrimaryNumber = `If you are attempting to update your mobile number\nUse code ${primaryOtp} to verify on wingsestilo.in\nValid for 2 minutes`;
      const messageForUpdateNumber = `Your are one step away from updating number\nUse code ${otp} to update mobile number\nValid for 3 minutes`;
      if (client) {
        await sendTwilioMessage(messageForPrimaryNumber, primaryPhoneNumber);
        await sendTwilioMessage(messageForUpdateNumber, phoneNumber);
      }
    }
  } catch (error) {
    throw error;
  }
}

async function verifyPhoneOtp(otp, userId, phoneNumber, primary) {
  try {
    if (!otp) {
      throw new ApiError(406, "Otp not found!");
    }

    const otpData = await Otp.findOne({ user: userId });

    if (!otpData) {
      throw new ApiError(406, "no otp data found!");
    }

    if (phoneNumber && +phoneNumber !== otpData.phoneNumber) {
      throw new ApiError(406, "Phone number provided is not correct!");
    }

    if (primary) {
      const dbOtp = otpData.primaryPhoneNumberOtp;

      if (otp !== dbOtp) {
        throw new ApiError(406, "Wrong primary otp provided!");
      }
      const currentTime = new Date().getTime();
      const timeDifference =
        currentTime - new Date(otpData.priPnOtpCreatedAt).getTime();
      const timeDifferenceInMinute = timeDifference / 1000 / 60;

      if (timeDifferenceInMinute > 2) {
        throw new ApiError(403, "Primary otp Expired!!!");
      }
    } else {
      const dbOtp = otpData.phoneNumberOtp;

      if (otp !== dbOtp) {
        throw new ApiError(406, "Wrong otp provided!");
      }
      const currentTime = new Date().getTime();
      const timeDifference =
        currentTime - new Date(otpData.pnOtpCreatedAt).getTime();
      const timeDifferenceInMinute = timeDifference / 1000 / 60;

      if (timeDifferenceInMinute > 3) {
        throw new ApiError(403, "OTP Expired!!!");
      }
    }
  } catch (error) {
    throw error;
  }
}

async function sendTwilioMessage(message, phoneNumber) {
  await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: "+91" + phoneNumber,
  });
}

const transporter = nodemailer.createTransport({
  host: "smtp-relay.sendinblue.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.NODEMAILER_AUTH_USER,
    pass: process.env.NODEMAILER_AUTH_PASS,
  },
});

async function sendOtpOnUserEmail(phoneNumber, userId, userEmail) {
  try {
    const otp = otpGenerator();
    const otpData = await Otp.findOne({ user: userId });

    if (!otpData) {
      await Otp.create({
        user: userId,
        emailOtp: otp,
        eOtpCreatedAt: Date.now(),
        phoneNumber,
      });
    } else {
      const currentTime = new Date().getTime();
      const timeDifference =
        currentTime - new Date(otpData.eOtpCreatedAt).getTime();

      const timeDifferenceInSeconds = timeDifference / 1000;
      const otpTimeRemaining = 120 - timeDifferenceInSeconds;

      if (timeDifferenceInSeconds < 120) {
        throw new ApiError(
          406,
          `You can send OTP after ${Math.ceil(otpTimeRemaining)} seconds.`
        );
      } else {
        otpData.emailOtp = otp;
        otpData.eOtpCreatedAt = Date.now();
        otpData.phoneNumber = phoneNumber;
        await otpData.save();
      }
    }

    await sendOtpViaNodemailer(otp, userEmail);
  } catch (error) {
    throw error;
  }
}

async function verifyEmailOtp(otp, userId, phoneNumber) {
  try {
    if (!otp) {
      throw new ApiError(406, "Otp not found!");
    }

    const otpData = await Otp.findOne({ user: userId });

    if (!otpData) {
      throw new ApiError(406, "no otp data found!");
    }

    if (phoneNumber && +phoneNumber !== otpData.phoneNumber) {
      throw new ApiError(406, "Phone number provided is not correct!");
    }

    const dbOtp = otpData.emailOtp;

    if (otp !== dbOtp) {
      throw new ApiError(406, "Wrong otp provided!");
    }

    const currentTime = new Date().getTime();
    const timeDifference =
      currentTime - new Date(otpData.eOtpCreatedAt).getTime();
    const timeDifferenceInMinute = timeDifference / 1000 / 60;

    if (timeDifferenceInMinute > 2) {
      throw new ApiError(403, "Otp Expired!!!");
    }
  } catch (error) {
    throw error;
  }
}

async function sendOtpViaNodemailer(otp, userEmail) {
  const otpTemplateFile = fs.readFileSync(
    path.join(__dirname, "../emailTemplates/emailOtp.ejs"),
    "utf-8"
  );

  const emailTemplate = ejs.render(otpTemplateFile, { otp });
  await transporter.sendMail({
    from: process.env.WINGS_ESTILO_MAIL_ID,
    to: userEmail,
    subject: "OTP for updating phone number",
    html: emailTemplate,
  });
}

module.exports = {
  sendOtpOnNumber,
  verifyPhoneOtp,
  sendOtpOnUserEmail,
  verifyEmailOtp,
  client,
};
