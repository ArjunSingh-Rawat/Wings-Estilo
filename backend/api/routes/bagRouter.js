const { verifyToken } = require("../middleware/authMiddlewares");
const express = require("express");
const router = express.Router();

const {
  addProduct,
  incrementOrDecrementProduct,
  removeFromBag,
  getProducts,
} = require("../controllers/bagController");

router.post("/add-to-bag", verifyToken, addProduct);

router.put("/add-quantity", verifyToken, incrementOrDecrementProduct);

router.delete("/remove-from-bag", verifyToken, removeFromBag);

router.get("/", verifyToken, getProducts);

module.exports = router;
