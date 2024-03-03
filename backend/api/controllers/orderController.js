const jwt = require("jsonwebtoken");
const Product = require("../models/productModel");
const {
  createRazorpayOrder,
  verifyRazorpayPayment,
} = require("../../utils/razorpayPayment");
const Order = require("../models/ordersModel");
const RazorpayPayment = require("../models/razorpayPaymentModel");
const User = require("../models/userModel");
const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/apiError");

const initiateOrder = asyncHandler(async (req, res) => {
  const { productId, productSize } = req.body;

  if (!productId) {
    throw new ApiError(400, "Product ID not found!!");
  }

  if (
    !productSize &&
    !["XS", "S", "M", "L", "XL", "XXL"].includes(productSize)
  ) {
    throw new ApiError(
      400,
      "Product size not selected or wrong size provided!!"
    );
  }

  const product = await Product.findOne({ _id: productId });
  if (!product) {
    throw new ApiError(404, "product not found!");
  }

  const quantityOfGivenSize = product.sizeAvailable[productSize];
  if (quantityOfGivenSize < 1) {
    throw new ApiError(400, "Size selected is out of stock");
  }

  const checkoutToken = jwt.sign(
    {
      productId,
      productSize,
    },
    process.env.CHECKOUT_TOKEN_SECRET,
    {
      expiresIn: "1h",
    }
  );

  const options = {
    httpOnly: true,
  };

  res.status(200).cookie("checkout_token", checkoutToken, options).json({
    success: true,
    message: "initiated order process!",
  });
});

const checkQuantity = asyncHandler((req, res) => {
  res.status(200).json({
    success: true,
    message: "quantity is available",
  });
});

const startRazorpayPaymentProcess = asyncHandler(async (req, res) => {
  const { product, productSize, quantity } = req.orderDetail;

  const amount = product.sellPrice * quantity;
  const { order, key } = await createRazorpayOrder(amount);

  const shippingAddress = req.body.shippingAddress;

  const orderDetailToken = jwt.sign(
    {
      productId: product._id,
      productSize,
      quantity,
      shippingAddress,
    },
    process.env.CHECKOUT_TOKEN_SECRET,
    {
      expiresIn: 30 * 60,
    }
  );

  const cookieOptionP = {
    httpOnly: true,
    signed: true,
  };

  res.status(200).cookie("orderDetails", orderDetailToken, cookieOptionP).json({
    success: true,
    message: "success",
    order,
    key,
  });
});

const createOrderOnSuccessfulPayment = asyncHandler(async (req, res) => {
  const userId = req.user.userid;
  const user = await User.findOne({ _id: userId });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  verifyRazorpayPayment(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  );

  const razorpayPayment = await RazorpayPayment.create({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  });

  const orderDetailToken = req.signedCookies.orderDetails;
  const orderDetails = jwt.verify(
    orderDetailToken,
    process.env.CHECKOUT_TOKEN_SECRET
  );

  const { productId, productSize, quantity, shippingAddress } = orderDetails;

  // TODO: logic when db fail to create RazorpayPayment or Order
  // for now just throwing error
  if (!razorpayPayment) {
    throw new ApiError(500, "failed to save RazorpayPayment in DB!");
  }

  const order = await Order.create({
    user: userId,
    items: [{ product: productId, productSize, quantity }],
    totalAmount: req.product.sellPrice * quantity,
    payment: {
      provider: "razorpay",
      details: razorpayPayment._id,
    },
    shippingAddress,
  });

  if (!order) {
    throw new ApiError(500, "failed to save order in DB!!");
  }

  res.status(200).json({
    success: true,
    message: "successfully created Order",
    order,
  });
});

module.exports = {
  initiateOrder,
  checkQuantity,
  startRazorpayPaymentProcess,
  createOrderOnSuccessfulPayment,
};
