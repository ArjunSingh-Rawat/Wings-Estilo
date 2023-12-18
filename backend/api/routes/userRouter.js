const express = require("express");
const { verifyToken } = require("../middleware/authMiddlewares");

const {
  addToWishlist,
  loginUser,
  registerUser,
  logoutUser,
  getOneUser,
} = require("../controllers/userController");

const router = express.Router();

router.post("/register", registerUser);

router.post("/login", loginUser);

router.get("/logout", verifyToken, logoutUser);

router.put("/add-to-wishlist", verifyToken, addToWishlist);

router.get("/:id", verifyToken, getOneUser);

module.exports = router;
