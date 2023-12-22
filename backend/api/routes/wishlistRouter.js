const express = require("express");
const { verifyToken } = require("../middleware/authMiddlewares");
const {
  addProduct,
  getWishlistItems,
  deleteWishlistItems,
} = require("../controllers/wishlistController");

const router = express.Router();

router.post("/", verifyToken, addProduct);

router.get("/", verifyToken, getWishlistItems);

router.delete("/", verifyToken, deleteWishlistItems);

module.exports = router;
