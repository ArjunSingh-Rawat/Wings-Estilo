const express = require("express");
const {
  initiateOrder,
  checkQuantity,
  startRazorpayPaymentProcess,
  createOrderOnSuccessfulPayment,
} = require("../controllers/orderController");
const {
  validateOrderDetails,
  validateShippingAddress,
  getSelectedProduct,
} = require("../middleware/validateProductOrder");

const router = express.Router();

router.post("/initiate", initiateOrder);

router.post("/quantity", validateOrderDetails, checkQuantity);

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

router.get("/product", getSelectedProduct, (req, res) => {
  res.status(200).json({
    success: true,
    message: "product details",
    product: req.product,
  });
});

module.exports = router;
