const express = require("express");
const { verifyToken } = require("../middleware/authMiddlewares");
const otpRouter = require("../routes/otpRouter");

const {
  redirectToGoogleOauth,
  signInSignUpHandler,
  addToWishlist,
  logoutUser,
  getOneUser,
  updateUserPersonalInfo,
  updatePhoneNumber,
  updatePhoneNumberWithEmail,
} = require("../controllers/userController");

const router = express.Router();

router.get("/sign-in", redirectToGoogleOauth);

router.get("/auth/google", signInSignUpHandler);

router.get("/logout", verifyToken, logoutUser);

router.put("/add-to-wishlist", verifyToken, addToWishlist);

router.get("/info", verifyToken, getOneUser);

router.put("/info", verifyToken, updateUserPersonalInfo);

router.put("/phone-number/phone", verifyToken, updatePhoneNumber);

router.put("/phone-number/email", verifyToken, updatePhoneNumberWithEmail);

router.use("/otp", verifyToken, otpRouter);

router.get("/ping-me", verifyToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: "ok!",
  });
});

module.exports = router;
