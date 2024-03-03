const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/apiError");

const verifyToken = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "Unauthorized request");
  }
  const user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

  if (!user) {
    throw new ApiError(401, "Invalid Access Token");
  }

  req.user = user;
  next();
});

async function verifyTokenForStaticRoute(req, res, next) {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new Error("Unauthorized request");
    }
    const user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (!user) {
      throw new Error("Invalid Access Token");
    }

    req.user = user;
    next();
  } catch (error) {
    req.error = error;
    next();
  }
}

async function setUserInLocalsIfLoggedIn(req, res, next) {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (token) {
    let userId;

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, userData) => {
      if (err) res.locals.user = null;
      else userId = userData.userid;
    });

    let user = await User.findOne({ _id: userId }).select("-refreshToken");
    if (user) {
      res.locals.user = user.firstName;
      req.userData = user;
    } else {
      res.locals.user = null;
    }
  } else {
    res.locals.user = null;
  }
  next();
}

async function authorizeAdminUser(req, res, next) {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new Error("Unauthorized request");
    }
    const userToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (!userToken) {
      throw new Error("Invalid Access Token");
    }

    const user = await User.findOne({ _id: userToken.userid });

    if (!user) {
      throw new Error("User not found");
    }

    if (!user.isAdmin) {
      throw new Error("Your are not allowed to access this resource!");
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  verifyToken,
  verifyTokenForStaticRoute,
  setUserInLocalsIfLoggedIn,
  authorizeAdminUser,
};
