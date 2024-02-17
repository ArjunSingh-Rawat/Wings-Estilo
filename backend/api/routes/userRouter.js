const express = require("express");
const { verifyToken } = require("../middleware/authMiddlewares");
const otpRouter = require("../routes/otpRouter");

const {
  redirectToGoogleOauth,
  signInSignUpHandler,
  addToWishlist,
  refreshAccessToken,
  logoutUser,
  getOneUser,
  updateUserPersonalInfo,
  updatePhoneNumber,
} = require("../controllers/userController");

const router = express.Router();

router.get("/sign-in", redirectToGoogleOauth);

router.get("/auth/google", signInSignUpHandler);

router.post("/refresh-access-token", refreshAccessToken);

router.get("/logout", verifyToken, logoutUser);

router.put("/add-to-wishlist", verifyToken, addToWishlist);

router.get("/ping-me", verifyToken, (req, res) => {
  res.status(200).json({
    message: "ok!",
  });
});

router.get("/info", verifyToken, getOneUser);

router.put("/info", verifyToken, updateUserPersonalInfo);

router.put("/add-phone-number", verifyToken, updatePhoneNumber);

router.use("/otp", verifyToken, otpRouter);

module.exports = router;
