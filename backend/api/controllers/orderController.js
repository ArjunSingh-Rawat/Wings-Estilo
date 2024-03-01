const jwt = require("jsonwebtoken");
const Product = require("../models/productModel");
const {
  createRazorpayOrder,
  verifyRazorpayPayment,
} = require("../../utils/razorpayPayment");
const Order = require("../models/ordersModel");
const RazorpayPayment = require("../models/razorpayPaymentModel");
const User = require("../models/userModel");

async function initiateOrder(req, res) {
  try {
    const { productId, productSize } = req.body;

    if (!productId) {
      throw new Error("Product ID not found!!");
    }

    if (
      !productSize &&
      !["XS", "S", "M", "L", "XL", "XXL"].includes(productSize)
    ) {
      throw new Error("Product size not selected or wrong size provided!!");
    }

    const product = await Product.findOne({ _id: productId });
    if (!product) {
      throw new Error("product not found!");
    }

    const quantityOfGivenSize = product.sizeAvailable[productSize];
    if (quantityOfGivenSize < 1) {
      throw new Error("Size selected is out of stock");
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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function checkQuantity(req, res) {
  try {
    res.status(200).json({
      success: true,
      message: "quantity is available",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function startRazorpayPaymentProcess(req, res) {
  try {
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

    res
      .status(200)
      .cookie("orderDetails", orderDetailToken, cookieOptionP)
      .json({
        success: true,
        message: "success",
        order,
        key,
      });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function createOrderOnSuccessfulPayment(req, res) {
  try {
    const userId = req.user.userid;
    const user = await User.findOne({ _id: userId });
    if (!user) {
      throw new Error("User not found");
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
      throw new Error("failed to save RazorpayPayment in DB!");
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
      throw new Error("failed to save order in DB!!");
    }

    res.status(200).json({
      success: true,
      message: "successfully created Order",
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  initiateOrder,
  checkQuantity,
  startRazorpayPaymentProcess,
  createOrderOnSuccessfulPayment,
};
