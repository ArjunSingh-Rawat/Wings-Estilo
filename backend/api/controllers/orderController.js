const jwt = require("jsonwebtoken");
const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/apiError");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const {
  createRazorpayOrder,
  verifyRazorpayPayment,
} = require("../../utils/razorpayPayment");
const RazorpayPayment = require("../models/razorpayPaymentModel");
const Order = require("../models/ordersModel");
const RentOrder = require("../models/rentOrdersModel");
const { deliveryCharges } = require("../../constants");
const {
  sendOrderDetailsToAdmin,
} = require("../../utils/sendOrderDetailToAdmin");

const cookieOptions = {
  httpOnly: true,
};

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

  res.status(200).cookie("checkout_token", checkoutToken, cookieOptions).json({
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

  res
    .cookie("checkout_token", newCheckoutToken, cookieOptions)
    .status(200)
    .json({
      success: true,
      message: "quantity is available",
    });
});

const startRazorpayPaymentProcess = asyncHandler(async (req, res) => {
  const sellOrRent = req.params.sellOrRent;
  if (!["sell", "rent"].includes(sellOrRent)) {
    throw new ApiError(406, "order type should contain sell or rent!!");
  }

  let amount = 0;
  const products = [];
  let selectFrom = null;
  sellOrRent === "sell"
    ? (selectFrom = "sellPrice")
    : (selectFrom = "rentPrice");

  for (const productData of req.products) {
    amount += productData.product[selectFrom] * +productData.quantity;
    products.push({
      productId: productData.product._id,
      productSize: productData.productSize,
      quantity: +productData.quantity,
      productPrice: productData.product[selectFrom],
    });
  }
  const shippingAddress = req.body.shippingAddress;

  const deliveryCharge = deliveryCharges[shippingAddress.state.toLowerCase()];
  amount += deliveryCharge;
  const { order, key } = await createRazorpayOrder(amount);

  const orderDetailToken = jwt.sign(
    { products, shippingAddress: shippingAddress._id },
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

const createSellOrderOnSuccessfulPayment = asyncHandler(async (req, res) => {
  const userId = req.user.userid;
  await checkUser(userId);

  const razorpayPaymentId = await verifyRazorpayPaymentAndSaveInDB(
    req.body.razorpay_order_id,
    req.body.razorpay_payment_id,
    req.body.razorpay_signature
  );

  const orderDetailToken = req.signedCookies.orderDetails;
  const orderDetails = jwt.verify(
    orderDetailToken,
    process.env.CHECKOUT_TOKEN_SECRET
  );

  const { products, shippingAddress } = orderDetails;
  const { totalAmount, items } = productInfoToDbFormat(products);

  let order = await Order.create({
    user: userId,
    items: items,
    totalAmount,
    payment: {
      provider: "Razorpay",
      details: razorpayPaymentId,
    },
    shippingAddress,
  });
  if (!order) {
    throw new ApiError(500, "failed to save order in DB!!");
  }

  res
    .status(200)
    .clearCookie("checkout_token", cookieOptions)
    .clearCookie("orderDetails", cookieOptions)
    .redirect("/profile?section=orders");

  await getAndSendOrderDetailsToAdmin("sell", order._id);
});

const getOrderDetails = asyncHandler(async (req, res) => {
  const userId = req.user.userid;
  const populateOptions = [
    {
      path: "items.product",
      select: "name sellPrice rentPrice image",
    },
    {
      path: "user",
      select: "firstName lastName email phoneNumber -_id",
    },
    "shippingAddress",
  ];
  const selectOptions = "-payment";

  const sellOrders = await Order.find({ user: userId })
    .populate(populateOptions)
    .select(selectOptions);

  const rentOrders = await RentOrder.find({ user: userId })
    .populate(populateOptions)
    .select(selectOptions);

  if (!sellOrders && !rentOrders) {
    throw new ApiError(404, "orders not found!");
  }
  res.status(200).json({
    success: true,
    message: "orders found!",
    orders: [...sellOrders, ...rentOrders],
  });
});

const updateOrder = asyncHandler(async (req, res) => {
  const orderId = req.params.id;
  const { itemsDetailsToChange } = req.body;

  const order = await Order.findOne({ _id: orderId });
  for (const itemIndex in itemsDetailsToChange) {
    order.items[itemIndex].status = itemsDetailsToChange[itemIndex];
    order.items[itemIndex].updatedAt = Date.now();
  }
  let orderStatus = "incomplete";
  for (const item of order.items) {
    if (item.status !== "Delivered") {
      orderStatus = "incomplete";
      break;
    } else orderStatus = "complete";
  }

  order.orderStatus = orderStatus;
  await order.save();

  res.status(202).json({
    success: true,
    message: "order updated successfully",
  });
});

const createRentOrderOnSuccessfulPayment = asyncHandler(async (req, res) => {
  const userId = req.user.userid;
  await checkUser(userId);

  const razorpayPaymentId = await verifyRazorpayPaymentAndSaveInDB(
    req.body.razorpay_order_id,
    req.body.razorpay_payment_id,
    req.body.razorpay_signature
  );

  const orderDetailToken = req.signedCookies.orderDetails;
  const orderDetails = jwt.verify(
    orderDetailToken,
    process.env.CHECKOUT_TOKEN_SECRET
  );

  const { products, shippingAddress } = orderDetails;
  const { totalAmount, items } = productInfoToDbFormat(products);

  let order = await RentOrder.create({
    user: userId,
    items: items,
    totalAmount,
    payment: {
      provider: "Razorpay",
      details: razorpayPaymentId,
    },
    shippingAddress,
  });
  if (!order) {
    throw new ApiError(500, "failed to save order in DB!!");
  }

  res
    .status(200)
    .clearCookie("checkout_token", cookieOptions)
    .clearCookie("orderDetails", cookieOptions)
    .redirect("/profile?section=orders");

  await getAndSendOrderDetailsToAdmin("rent", order._id);
});

/*---------- functions---------------------*/

async function checkUser(userId) {
  const user = await User.findOne({ _id: userId });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
}

async function verifyRazorpayPaymentAndSaveInDB(
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature
) {
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

  /*
    TODO: logic when db fail to create RazorpayPayment or Order
    for now just throwing error
  */
  if (!razorpayPayment) {
    throw new ApiError(500, "failed to save RazorpayPayment in DB!");
  }

  return razorpayPayment._id;
}

function productInfoToDbFormat(products) {
  const items = [];
  let totalAmount = 0;
  for (const product of products) {
    items.push({
      product: product.productId,
      productSize: product.productSize,
      quantity: product.quantity,
      updateAt: new Date(),
    });
    totalAmount += product.productPrice * +product.quantity;
  }
  return { totalAmount, items };
}

async function getAndSendOrderDetailsToAdmin(sellOrRent, orderId) {
  let findFrom = null;
  if (sellOrRent === "sell") findFrom = Order;
  else findFrom = RentOrder;

  const order = await findFrom.findOne({ _id: orderId }).populate([
    {
      path: "user",
      select: "firstName lastName email gender phoneNumber",
    },
    {
      path: "items.product",
      select: "name sellPrice rentPrice image",
    },
    {
      path: "payment.details",
      select: "-_id -__v -updateAt",
    },
    "shippingAddress",
  ]);
  await sendOrderDetailsToAdmin(order, sellOrRent);
}

module.exports = {
  initiateOrder,
  checkQuantity,
  startRazorpayPaymentProcess,
  createSellOrderOnSuccessfulPayment,
  getOrderDetails,
  updateOrder,
  createRentOrderOnSuccessfulPayment,
};
