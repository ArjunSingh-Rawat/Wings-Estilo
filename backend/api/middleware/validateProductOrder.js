const Product = require("../models/productModel");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/apiError");

const validateOrderDetails = asyncHandler(async (req, res, next) => {
  const checkoutToken = req.cookies.checkout_token;

  const tokenData = jwt.verify(
    checkoutToken,
    process.env.CHECKOUT_TOKEN_SECRET
  );

  const selectedProductId = tokenData.productId;
  const selectedSize = tokenData.productSize;

  const { productId, productSize, quantity } = req.body;

  if (selectedProductId !== productId) {
    throw new ApiError(
      406,
      "Product Id provided not matching with product ID selected!"
    );
  }
  if (selectedSize !== productSize) {
    throw new ApiError(406, "Selected size not matching with given size!");
  }

  const product = await Product.findOne({ _id: selectedProductId })
    .populate("sizeAvailable")
    .select("name sellPrice image sizeAvailable shortDescription");

  if (!product) {
    throw new ApiError(404, "Product not found!");
  }

  const availableQuantity = product.sizeAvailable[selectedSize.toLowerCase()];

  if (quantity > availableQuantity) {
    throw new ApiError(404, "Given quantity is not in stock!");
  }
  req.orderDetail = {
    product,
    quantity,
    productSize,
  };
  next();
});

const getSelectedProduct = asyncHandler(async (req, res, next) => {
  const checkoutToken = req.cookies.checkout_token;

  const tokenData = jwt.verify(
    checkoutToken,
    process.env.CHECKOUT_TOKEN_SECRET
  );
  const productId = tokenData.productId;

  const product = await Product.findOne({ _id: productId }).select(
    "name sellPrice shortDescription image"
  );

  if (!product) {
    throw new ApiError(404, "Product not found!");
  }
  req.product = product;
  req.productSize = tokenData.productSize;
  next();
});

const validateShippingAddress = asyncHandler(async (req, res, next) => {
  const { shippingAddress } = req.body;

  const userId = req.user.userid;
  const user = await User.findOne({ _id: userId });

  if (!user) {
    throw new ApiError(404, "user not found");
  }

  if (!user.addresses.includes(shippingAddress)) {
    throw new ApiError(406, "Wrong address provided!");
  }

  next();
});

module.exports = {
  validateOrderDetails,
  getSelectedProduct,
  validateShippingAddress,
};
