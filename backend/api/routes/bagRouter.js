const { verifyToken } = require("../middleware/authMiddlewares");
const express = require("express");
const router = express.Router();

const {
  addProduct,
  incrementOrDecrementProduct,
  removeFromBag,
  getProduct,
  getProducts,
  getTotalAmount,
} = require("../controllers/bagController");

router.post("/add-to-bag", verifyToken, addProduct);

router.put("/add-quantity", verifyToken, incrementOrDecrementProduct);

router.delete("/", verifyToken, removeFromBag);

router.get("/totalAmount", verifyToken, getTotalAmount);

router.get("/:productId", verifyToken, getProduct);

router.get("/", verifyToken, getProducts);

module.exports = router;
