const express = require("express");
const {
  initiateOrder,
  checkQuantity,
  startRazorpayPaymentProcess,
  createOrderOnSuccessfulPayment,
  getOrderDetails,
  updateOrder,
} = require("../controllers/orderController");
const {
  validateOrderDetails,
  validateShippingAddress,
  getSelectedProduct,
} = require("../middleware/validateProductOrder");
const { authorizeAdminUser } = require("../middleware/authMiddlewares");

const router = express.Router();

router.post("/initiate", initiateOrder);

router.post("/quantity", checkQuantity);

router.post(
  "/start-payment",
  validateOrderDetails,
  validateShippingAddress,
  startRazorpayPaymentProcess
);

router.post(
  "/create-order",
  getSelectedProduct,
  createOrderOnSuccessfulPayment
);

router.get("/products", getSelectedProduct, (req, res) => {
  res.status(200).json({
    success: true,
    message: "product details",
    products: req.products,
  });
});

router.get("/", getOrderDetails);

router.put("/:id", authorizeAdminUser, updateOrder);

module.exports = router;
