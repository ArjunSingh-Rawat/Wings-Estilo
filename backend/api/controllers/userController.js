const User = require("../models/userModel");
const { v4: uuid } = require("uuid");
const jwt = require("jsonwebtoken");

let pageRedirectUrl = "";

async function generateAccessAndRefreshTokens(userId) {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new Error(
      "Something went wrong while generating refresh and access token"
    );
  }
}

async function redirectToGoogleOauth(req, res) {
  try {
    const oauthState = uuid();
    const cookieOptions = {
      maxAge: 1000 * 60 * 5,
      signed: true,
      httpOnly: true,
      secure: true,
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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function signInSignUpHandler(req, res) {
  try {
    const { code, state } = req.query;
    const csrfToken = req.signedCookies.CSRF;

    if (!code) {
      throw new Error("Code from google oauth not found!");
    }

    if (state !== csrfToken) {
      throw new Error("Invalid Sate");
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

    let user = await User.findOne({ email }).select("-password -refreshToken");

    if (!user) {
      user = await registerUser(
        googleUserData.given_name,
        googleUserData.family_name,
        email
      );
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
    );

    const options = {
      httpOnly: true,
      secure: true,
      maxAge: 1000 * 60 * 60,
    };
    pageRedirectUrl = redirectUrlSanitizer(pageRedirectUrl);

    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .redirect(`http://localhost:5000${pageRedirectUrl}`);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

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
    const createdUser = await User.findById(newUser._id).select(
      "-password -refreshToken"
    );
    if (!createdUser) {
      throw new Error("Something went wrong while registering the user");
    }

    return createdUser;
  } catch (error) {
    throw new Error(error);
  }
}

async function refreshAccessToken(req, res) {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  try {
    if (!incomingRefreshToken) {
      throw new Error("unauthorized request");
    }

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?.userid);

    if (!user) {
      throw new Error("Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new Error("Refresh token is expired or used");
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json({
        success: true,
        message: "success!",
      });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function logoutUser(req, res) {
  try {
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          refreshToken: undefined,
        },
      },
      {
        new: true,
      }
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .redirect("/");
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function addToWishlist(req, res) {
  try {
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
      throw new Error("unable to add to wishlist");
    }

    res.status(202).json({
      success: true,
      message: "Success!",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function getOneUser(req, res) {
  try {
    const user = await User.findOne({ _id: req.user.userid })
      .populate("addresses")
      .select("-password -refreshToken");

    if (!user) {
      return res.status(404).json("user not found!");
    }

    res.status(200).json({
      success: true,
      message: "success!",
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function updateUserPersonalInfo(req, res) {
  try {
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

    const user = await User.findOneAndUpdate(
      { _id: req.user.userid },
      userInfoToUpdate,
      { new: true }
    ).select("-refreshToken");

    res.status(200).json({
      success: true,
      message: "success!",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  redirectToGoogleOauth,
  signInSignUpHandler,
  registerUser,
  refreshAccessToken,
  logoutUser,
  addToWishlist,
  getOneUser,
  updateUserPersonalInfo,
};
