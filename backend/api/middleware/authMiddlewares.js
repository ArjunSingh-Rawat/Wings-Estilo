const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

async function verifyToken(req, res, next) {
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
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function setUserInLocalsIfLoggedIn(req, res, next) {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new Error();
    }

    let user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (!user) {
      throw new Error();
    }

    user = await User.findOne({ _id: user.userid }).select("fullname");

    if (!user) {
      throw new Error();
    }
    res.locals.user = user.fullname;
    next();
  } catch (error) {
    res.locals.user = null;
    next();
  }
}

module.exports = {
  verifyToken,
  setUserInLocalsIfLoggedIn,
};
