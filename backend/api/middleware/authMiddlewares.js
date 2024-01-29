const jwt = require("jsonwebtoken");

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

module.exports = {
  verifyToken,
  verifyTokenForStaticRoute,
};
