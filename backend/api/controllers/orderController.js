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
  const { products } = req.body;
  for (const product of products) {
    await validateProduct(
      product.productId,
      product.productSize,
      product.quantity
    );
  }

  const checkoutToken = jwt.sign(
    {
      products,
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

async function validateProduct(productId, productSize, quantity) {
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

  const quantityOfGivenSize = product.sizeAvailable[productSize.toLowerCase()];
  if (quantityOfGivenSize < 1) {
    throw new ApiError(400, "Size selected is out of stock");
  }

  if (quantity > quantityOfGivenSize) {
    throw new ApiError(400, "Give quantity not in stock!");
  }
}

const checkQuantity = asyncHandler((req, res) => {
  res.status(200).json({
    success: true,
    message: "quantity is available",
  });
});

const startRazorpayPaymentProcess = asyncHandler(async (req, res) => {
  let amount = 0;
  const products = [];
  for (const productData of req.products) {
    amount += productData.product.sellPrice * +productData.quantity;
    products.push({
      productId: productData.product._id,
      productSize: productData.productSize,
      quantity: +productData.quantity,
      productPrice: productData.product.sellPrice,
    });
  }

  const { order, key } = await createRazorpayOrder(amount);
  const shippingAddress = req.body.shippingAddress;

  const orderDetailToken = jwt.sign(
    { products, shippingAddress },
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

  const { products, shippingAddress } = orderDetails;

  // TODO: logic when db fail to create RazorpayPayment or Order
  // for now just throwing error
  if (!razorpayPayment) {
    throw new ApiError(500, "failed to save RazorpayPayment in DB!");
  }

  const items = [];
  let totalAmount = 0;
  for (const product of products) {
    items.push({
      product: product.productId,
      productSize: product.productSize,
      quantity: product.quantity,
    });
    totalAmount += product.productPrice * +product.quantity;
  }

  const order = await Order.create({
    user: userId,
    items: items,
    totalAmount,
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
