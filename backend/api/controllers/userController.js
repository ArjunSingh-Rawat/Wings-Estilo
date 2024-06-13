const User = require("../models/userModel");
const { v4: uuid } = require("uuid");
const {
  verifyPhoneOtp,
  verifyEmailOtp,
} = require("../../utils/sendAndVerifyOtp");
const validatePhoneNumber = require("../../utils/validatePhoneNumber");
const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/apiError");

let pageRedirectUrl = "";

async function generateAccessAndRefreshTokens(userId) {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();

    return { accessToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating and access token"
    );
  }
}

const redirectToGoogleOauth = asyncHandler((req, res) => {
  const oauthState = uuid();
  const cookieOptions = {
    maxAge: 1000 * 60 * 5,
    signed: true,
    httpOnly: true,
    // secure: true,
  };

  res.cookie("CSRF", oauthState, cookieOptions);

  const oauthQueryParams = {
    client_id: process.env.OAUTH_CLIENT_ID,
    redirect_uri: process.env.OAUTH_REDIRECT_URI,
    response_type: "code",
    scope: "profile email",
    state: oauthState,
  };

  pageRedirectUrl = req.query.pathName;
  const urlParams = new URLSearchParams(oauthQueryParams).toString();

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${urlParams}`);
});

const signInSignUpHandler = asyncHandler(async (req, res) => {
  const { code, state } = req.query;
  const csrfToken = req.signedCookies.CSRF;

  if (!code) {
    throw new ApiError(404, "Code from google oauth not found!");
  }

  if (state !== csrfToken) {
    throw new ApiError(401, "Invalid Sate");
  }

  const params = new URLSearchParams({
    code,
    client_id: process.env.OAUTH_CLIENT_ID,
    client_secret: process.env.OAUTH_CLIENT_SECRET,
    redirect_uri: process.env.OAUTH_REDIRECT_URI,
    grant_type: "authorization_code",
  });

  const response = await fetch(
    `https://oauth2.googleapis.com/token?${params}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  const data = await response.json();
  const googleOathAccessToken = data.access_token;

  const userRequest = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      headers: {
        Authorization: `Bearer ${googleOathAccessToken}`,
      },
    }
  );

  const googleUserData = await userRequest.json();
  const email = googleUserData.email;

  let user = await User.findOne({ email }).select("-password");

  if (!user) {
    user = await registerUser(
      googleUserData.given_name,
      googleUserData.family_name,
      email
    );
  }

  const { accessToken } = await generateAccessAndRefreshTokens(user._id);

  const options = {
    httpOnly: true,
    // secure: true,
    maxAge: 1000 * 60 * 60 * 6,
  };
  pageRedirectUrl = redirectUrlSanitizer(pageRedirectUrl);

  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .redirect(`http://localhost:5000${pageRedirectUrl}`);
});

function redirectUrlSanitizer(url) {
  if (!url) {
    return "";
  }
  if (url[0] !== "/") {
    url = "/" + url;
  }
  if (url.split("/")[1] === "api") {
    url = "/404";
  }
  return url;
}

async function registerUser(firstName, lastName, email) {
  try {
    const newUser = await User.create({
      firstName,
      lastName,
      email,
    });
    const createdUser = await User.findById(newUser._id).select("-password");
    if (!createdUser) {
      throw new ApiError(
        500,
        "Something went wrong while registering the user"
      );
    }

    return createdUser;
  } catch (error) {
    throw error;
  }
}

const logoutUser = asyncHandler((req, res) => {
  const options = {
    httpOnly: true,
    // secure: true,
  };

  return res.status(200).clearCookie("accessToken", options).redirect("/");
});

const addToWishlist = asyncHandler(async (req, res) => {
  const user = await User.findOneAndUpdate(
    { _id: req.user.userid },
    {
      $addToSet: {
        wishList: req.body.productId,
      },
    },
    { new: true }
  );

  if (!user) {
    throw new ApiError(500, "unable to add to wishlist");
  }

  res.status(200).json({
    success: true,
    message: "Success!",
    data: user,
  });
});

const getOneUser = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.user.userid })
    .populate("addresses")
    .select("-password");

  user.addresses.sort((a, b) => {
    if (a.defaultAddress && !b.defaultAddress) {
      return -1;
    } else if (!a.defaultAddress && b.defaultAddress) {
      return 1;
    } else {
      return 0;
    }
  });

  if (!user) {
    return res.status(404).json("user not found!");
  }

  res.status(200).json({
    success: true,
    message: "success!",
    user,
  });
});

const updateUserPersonalInfo = asyncHandler(async (req, res) => {
  const userInfoToUpdate = {
    firstName: "",
    lastName: "",
    gender: "",
  };

  for (const field in userInfoToUpdate) {
    if (req.body[field]) {
      userInfoToUpdate[field] = req.body[field];
    } else {
      delete userInfoToUpdate[field];
    }
  }

  await User.findOneAndUpdate({ _id: req.user.userid }, userInfoToUpdate, {
    new: true,
  });

  res.status(200).json({
    success: true,
    message: "success!",
  });
});

const updatePhoneNumber = asyncHandler(async (req, res) => {
  const { primaryOtp, updateOtp, phoneNumber } = req.body;
  validatePhoneNumber(phoneNumber);

  const user = await User.findOne({ _id: req.user.userid });
  if (user.phoneNumber) {
    await verifyPhoneOtp(primaryOtp, req.user.userid, phoneNumber, true);
    await verifyPhoneOtp(updateOtp, req.user.userid, phoneNumber, false);
  } else {
    await verifyPhoneOtp(primaryOtp, req.user.userid, phoneNumber, true);
  }

  user.phoneNumber = phoneNumber;
  user.isNumberVerified = true;
  try {
    await user.save();
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(403, "Phone number not available!!");
    } else {
      throw error;
    }
  }
  res.status(200).json({
    success: true,
    message: "successfully added number",
    user,
  });
});

const updatePhoneNumberWithEmail = asyncHandler(async (req, res) => {
  const { otp, phoneNumber } = req.body;
  validatePhoneNumber(phoneNumber);

  const user = await User.findOne({ _id: req.user.userid });
  await verifyEmailOtp(otp, user._id, phoneNumber);

  user.phoneNumber = phoneNumber;
  user.isNumberVerified = true;
  try {
    await user.save();
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(403, "Phone number not available!!");
    } else {
      throw error;
    }
  }
  res.status(200).json({
    success: true,
    message: "successfully added number",
    user,
  });
});

module.exports = {
  redirectToGoogleOauth,
  signInSignUpHandler,
  registerUser,
  logoutUser,
  addToWishlist,
  getOneUser,
  updateUserPersonalInfo,
  updatePhoneNumber,
  updatePhoneNumberWithEmail,
};
