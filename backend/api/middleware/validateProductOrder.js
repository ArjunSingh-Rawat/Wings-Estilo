const Product = require("../models/productModel");
const User = require("../models/userModel");
const Addresses = require("../models/addressModel");
const jwt = require("jsonwebtoken");
const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/apiError");

const validateOrderDetails = asyncHandler(async (req, res, next) => {
  const checkoutToken = req.cookies.checkout_token;

  const tokenData = jwt.verify(
    checkoutToken,
    process.env.CHECKOUT_TOKEN_SECRET
  );

  const selectedProducts = tokenData.products;
  const { products } = req.body;

  const orderDetails = [];

  for (let i = 0; i < selectedProducts.length; i++) {
    await validateOrderProducts(
      selectedProducts[i].productId,
      selectedProducts[i].productSize,
      products[i].productId,
      products[i].productSize,
      products[i].quantity,
      orderDetails
    );
  }

  req.products = orderDetails;
  next();
});

async function validateOrderProducts(
  selectedProductId,
  selectedSize,
  productId,
  productSize,
  quantity,
  orderDetails
) {
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
    .select("name sellPrice rentPrice image sizeAvailable shortDescription");

  if (!product) {
    throw new ApiError(404, "Product not found!");
  }

  const availableQuantity = product.sizeAvailable[selectedSize.toLowerCase()];

  if (+quantity > availableQuantity) {
    throw new ApiError(404, "Given quantity is not in stock!");
  }

  orderDetails.push({ product, productSize, quantity });
}

const getSelectedProduct = asyncHandler(async (req, res, next) => {
  const checkoutToken = req.cookies.checkout_token;
  const tokenData = jwt.verify(
    checkoutToken,
    process.env.CHECKOUT_TOKEN_SECRET
  );
  const selectedProducts = tokenData.products;

  const productToQuery = {};
  for (const product of selectedProducts) {
    if (!productToQuery[product.productId]) {
      productToQuery[product.productId] = [
        { productSize: product.productSize, quantity: product.quantity },
      ];
    } else {
      productToQuery[product.productId].push({
        productSize: product.productSize,
        quantity: product.quantity,
      });
    }
  }

  const products = [];
  for (const productId in productToQuery) {
    const product = await Product.findOne({ _id: productId }).select(
      "name sellPrice rentPrice shortDescription image"
    );

    if (!product) {
      throw new ApiError(404, "Product not found!");
    }

    products.push({
      product,
      productSizesAndQuantity: productToQuery[productId],
    });
  }
  req.products = products;

  next();
});

const validateShippingAddress = asyncHandler(async (req, res, next) => {
  const { shippingAddress } = req.body;
  if (!shippingAddress) {
    throw new ApiError(400, "Shipping address not provided!");
  }
  const userId = req.user.userid;
  const user = await User.findOne({ _id: userId });
  const address = await Addresses.findOne({ _id: shippingAddress._id });

  if (!user) {
    throw new ApiError(404, "user not found");
  }

  if (!user.addresses.includes(shippingAddress._id)) {
    throw new ApiError(406, "Wrong address provided!");
  }

  if (address.state != shippingAddress.state) {
    throw new ApiError(406, "state is not matching with given address id!!");
  }

  next();
});

module.exports = {
  validateOrderDetails,
  getSelectedProduct,
  validateShippingAddress,
};
