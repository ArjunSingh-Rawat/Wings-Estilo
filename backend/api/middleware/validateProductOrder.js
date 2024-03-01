const Product = require("../models/productModel");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");

async function validateOrderDetails(req, res, next) {
  try {
    const checkoutToken = req.cookies.checkout_token;

    const tokenData = jwt.verify(
      checkoutToken,
      process.env.CHECKOUT_TOKEN_SECRET
    );

    const selectedProductId = tokenData.productId;
    const selectedSize = tokenData.productSize;

    const { productId, productSize, quantity } = req.body;

    if (selectedProductId !== productId) {
      throw new Error(
        "Product Id provided not matching with product ID selected!"
      );
    }
    if (selectedSize !== productSize) {
      throw new Error("Selected size not matching with given size!");
    }

    const product = await Product.findOne({ _id: selectedProductId })
      .populate("sizeAvailable")
      .select("name sellPrice image sizeAvailable shortDescription");

    if (!product) {
      throw new Error("Product not found!");
    }

    const availableQuantity = product.sizeAvailable[selectedSize.toLowerCase()];

    if (quantity > availableQuantity) {
      throw new Error("Given quantity is not in stock!");
    }
    req.orderDetail = {
      product,
      quantity,
      productSize,
    };
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function getSelectedProduct(req, res, next) {
  try {
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
      throw new Error("Product not found!");
    }
    req.product = product;
    req.productSize = tokenData.productSize;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function validateShippingAddress(req, res, next) {
  try {
    const { shippingAddress } = req.body;

    const userId = req.user.userid;
    const user = await User.findOne({ _id: userId });

    if (!user) {
      throw new Error("user not found");
    }

    if (!user.addresses.includes(shippingAddress)) {
      throw new Error("Wrong address provided!");
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  validateOrderDetails,
  getSelectedProduct,
  validateShippingAddress,
};
