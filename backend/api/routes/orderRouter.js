const express = require("express");
const {
  initiateOrder,
  checkQuantity,
  startRazorpayPaymentProcess,
  getOrderDetails,
  updateOrder,
  createSellOrderOnSuccessfulPayment,
  createRentOrderOnSuccessfulPayment,
} = require("../controllers/orderController");
const {
  validateOrderDetails,
  validateShippingAddress,
  getSelectedProduct,
} = require("../middleware/validateProductOrder");
const { authorizeAdminUser } = require("../middleware/authMiddlewares");
const { deliveryCharges } = require("../../constants");
const router = express.Router();

router.post("/initiate", initiateOrder);

router.post("/quantity", checkQuantity);

router.post(
  "/:sellOrRent/start-payment",
  validateOrderDetails,
  validateShippingAddress,
  startRazorpayPaymentProcess
);

router.post(
  "/create-sell-order",
  getSelectedProduct,
  createSellOrderOnSuccessfulPayment
);

router.post(
  "/create-rent-order",
  getSelectedProduct,
  createRentOrderOnSuccessfulPayment
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

router.get("/delivery-charge/:state", (req, res) => {
  try {
    const state = req.params.state.toLowerCase();
    const deliveryCharge = deliveryCharges[state];

    res.status(200).json({
      success: true,
      message: "here is your delivery charge!",
      deliveryCharge,
    });
  } catch (error) {
    res.status(404).json({
      success: true,
      message: "Wrong state provided!",
    });
  }
});

module.exports = router;
