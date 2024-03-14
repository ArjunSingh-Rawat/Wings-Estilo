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
const Api = require("twilio/lib/rest/Api");

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

const checkQuantity = asyncHandler(async (req, res) => {
  const checkoutToken = req.cookies.checkout_token;

  const tokenData = jwt.verify(
    checkoutToken,
    process.env.CHECKOUT_TOKEN_SECRET
  );
  const selectedProducts = tokenData.products;

  const { productId, productSize, quantity } = req.body;

  if (
    !selectedProducts.find(
      ({ productId: selectedProductId }) => selectedProductId === productId
    )
  ) {
    throw new ApiError(
      406,
      "Product Id provided not matching with product ID selected!"
    );
  }
  if (
    !selectedProducts.find(
      ({ productSize: selectedProductSize }) =>
        selectedProductSize === productSize
    )
  ) {
    throw new ApiError(406, "Selected size not matching with given size!");
  }

  const product = await Product.findOne({ _id: productId })
    .populate("sizeAvailable")
    .select("name sellPrice image sizeAvailable shortDescription");

  if (!product) {
    throw new ApiError(404, "Product not found!");
  }

  const availableQuantity = product.sizeAvailable[productSize.toLowerCase()];
  if (+quantity > availableQuantity) {
    throw new ApiError(403, "You reached maximum quantity available!");
  }
  if (+quantity < 1) {
    throw new ApiError(403, "Quantity should be at least 1!");
  }

  const index = selectedProducts.findIndex(
    ({ productId: selectedProductId }) => selectedProductId === productId
  );
  selectedProducts[index].quantity = quantity;

  const newCheckoutToken = jwt.sign(
    {
      products: selectedProducts,
    },
    process.env.CHECKOUT_TOKEN_SECRET,
    {
      expiresIn: "1h",
    }
  );

  const options = {
    httpOnly: true,
  };

  res.cookie("checkout_token", newCheckoutToken, options).status(200).json({
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
  const options = {
    httpOnly: true,
  };
  res
    .status(200)
    .clearCookie("checkout_token", options)
    .clearCookie("orderDetails", options)
    .redirect("/profile?section=orders");
});

const getOrderDetails = asyncHandler(async (req, res) => {
  const userId = req.user.userid;
  const orders = await Order.find({ user: userId });
  if (!orders) {
    throw new ApiError(404, "orders not found!");
  }
  res.status(200).json({
    success: true,
    message: "orders found!",
    orders,
  });
});

module.exports = {
  initiateOrder,
  checkQuantity,
  startRazorpayPaymentProcess,
  createOrderOnSuccessfulPayment,
  getOrderDetails,
};
