const express = require("express");
const { verifyToken } = require("../middleware/authMiddlewares");

const {
  redirectToGoogleOauth,
  signInSignUpHandler,
  addToWishlist,
  refreshAccessToken,
  logoutUser,
  getOneUser,
} = require("../controllers/userController");

const router = express.Router();

router.get("/sign-in", redirectToGoogleOauth);

router.get("/auth/google", signInSignUpHandler);

router.post("/refresh-access-token", refreshAccessToken);

router.get("/logout", verifyToken, logoutUser);

router.put("/add-to-wishlist", verifyToken, addToWishlist);

router.get("/ping-me", verifyToken, (req, res) => {
  res.status(200).end();
});

router.get("/:id", verifyToken, getOneUser);

module.exports = router;
