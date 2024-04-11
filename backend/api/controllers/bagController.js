const Bag = require("../models/bagModel");
const Product = require("../models/productModel");
const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/apiError");

const addProduct = asyncHandler(async (req, res) => {
  const { productId, productSize } = req.body;
  const userId = req.user.userid;

  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  if (product.sizeAvailable[productSize.toLowerCase()] < 1) {
    throw new ApiError(406, "Product is out of stock!");
  }

  if (!product.forSell) {
    throw new ApiError(406, "Only purchasable item can be added in bag!");
  }

  let bag = await Bag.findOne({ user: userId });
  if (!bag) {
    bag = await Bag.create({
      user: userId,
      items: [
        {
          product: productId,
          productSize: productSize.toLowerCase(),
        },
      ],
    });
  } else {
    const alreadyInBag = bag.items.find(
      (item) =>
        item.product.equals(productId) &&
        item.productSize === productSize.toLowerCase()
    );

    if (alreadyInBag) {
      throw new ApiError(403, "Product is already in bag!");
    }

    bag.items.push({
      product: productId,
      productSize: productSize.toLowerCase(),
    });
  }

  bag.totalAmount += product.sellPrice;
  bag = await bag.save();

  res.status(202).json({
    success: true,
    message: "Successfully added product in bag!",
    newItem: bag,
  });
});

const incrementOrDecrementProduct = asyncHandler(async (req, res) => {
  const { productId, productSize, incOrDecFlag } = req.body;
  const userId = req.user.userid;

  if (!["inc", "dec"].includes(incOrDecFlag)) {
    throw new ApiError(
      400,
      "Increment(inc) or Decrement(dec) flag not provided!!"
    );
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  let bag = await Bag.findOne({
    user: userId,
  });

  if (!bag) {
    throw new ApiError(400, "Product is not added to bag yet!!");
  }

  const itemIndex = bag.items.findIndex(
    (item) =>
      item.product.equals(productId) &&
      item.productSize === productSize.toLowerCase()
  );

  if (itemIndex !== -1) {
    if (incOrDecFlag === "inc") {
      if (
        bag.items[itemIndex].quantity + 1 >
        product.sizeAvailable[bag.items[itemIndex].productSize]
      ) {
        throw new ApiError(403, "You reached maximum quantity available!");
      }
      bag.items[itemIndex].quantity += 1;
      bag.totalAmount += product.sellPrice;
    } else {
      if (bag.items[itemIndex].quantity - 1 < 1) {
        throw new ApiError(403, "Quantity should be at least 1!");
      }
      bag.items[itemIndex].quantity -= 1;
      bag.totalAmount -= product.sellPrice;
    }
  } else {
    throw new ApiError(400, "Product not added in Bag yet!!");
  }

  bag = await bag.save();

  res.status(202).json({
    success: true,
    message: "Success!",
    newItem: bag,
  });
});

const removeFromBag = asyncHandler(async (req, res) => {
  const { productId, productSize } = req.body;
  const userId = req.user.userid;

  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  let bag = await Bag.findOne({
    user: userId,
    "items.product": productId,
    "items.productSize": productSize.toLowerCase(),
  });

  if (!bag) {
    throw new ApiError(404, "Product not found in bag");
  }

  const itemQuantity = bag.items.find(
    (item) =>
      item.product.equals(productId) &&
      item.productSize === productSize.toLowerCase()
  ).quantity;

  bag.totalAmount -= product.sellPrice * itemQuantity;

  bag.items.pull({ product: productId, productSize });

  bag = await bag.save({ new: true });

  res.status(202).json({
    success: true,
    message: "Successfully removed product in bag!",
    newItem: bag,
  });
});

const getProduct = asyncHandler(async (req, res) => {
  const userId = req.user.userid;
  const productId = req.params.productId;

  const bag = await Bag.findOne({
    user: userId,
    "items.product": productId,
  }).populate({
    path: "items.product",
    select: "name sellPrice image countInStock",
  });

  if (!bag) {
    throw new ApiError(404, "product not found in bag!!");
  }

  const item = bag.items.find((item) => item.product.equals(productId));

  res.status(202).json({
    success: true,
    message: "Success!",
    item,
  });
});

const getProducts = asyncHandler(async (req, res) => {
  const userId = req.user.userid;

  let data = await Bag.findOne({
    user: userId,
  }).populate({
    path: "items.product",
    select: "name sellPrice image countInStock sizeAvailable",
  });

  if (!data || !data.items.length) {
    throw new ApiError(404, "No products in bag");
  }

  let items = data.items;
  let i = 0;
  for (const item of data.items) {
    if (item.product.sizeAvailable[item.productSize] < 1) {
      data.items.pull({
        product: item.product.productId,
        productSize: item.productSize,
      });
      items.splice(i, 1);
    } else if (item.quantity > item.product.sizeAvailable[item.productSize]) {
      item.quantity = item.product.sizeAvailable[item.productSize];
      items[i].quantity = item.product.sizeAvailable[item.productSize];
    }
    i++;
  }
  await data.save();
  res.status(202).json({
    success: true,
    message: "Success!",
    data: items,
  });
});

const getTotalAmount = asyncHandler(async (req, res) => {
  const userId = req.user.userid;

  const bag = await Bag.findOne({
    user: userId,
  });

  if (!bag) {
    throw new ApiError(404, "Product not found!!");
  }

  res.status(202).json({
    success: true,
    message: "Success!",
    totalAmount: bag.totalAmount,
  });
});

module.exports = {
  addProduct,
  incrementOrDecrementProduct,
  removeFromBag,
  getProduct,
  getProducts,
  getTotalAmount,
};
