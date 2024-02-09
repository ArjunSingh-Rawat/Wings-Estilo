const Bag = require("../models/bagModel");
const Product = require("../models/productModel");

async function addProduct(req, res) {
  try {
    const productId = req.body.productId;
    const userId = req.user.userid;

    const product = await Product.findById(productId);
    if (!product) {
      throw new Error("Product not found");
    }

    let bag = await Bag.findOne({ user: userId });
    if (!bag) {
      bag = await Bag.create({
        user: userId,
        items: [
          {
            product: productId,
          },
        ],
      });
    } else {
      const alreadyInBag = bag.items.find((item) =>
        item.product.equals(productId)
      );

      if (alreadyInBag) {
        throw new Error("Product is already in bag!");
      }

      bag.items.push({
        product: productId,
      });
    }

    bag.totalAmount += product.sellPrice;
    bag = await bag.save();

    res.status(202).json({
      success: true,
      message: "Success!",
      newItem: bag,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function incrementOrDecrementProduct(req, res) {
  try {
    const { productId, incOrDecFlag } = req.body;
    const userId = req.user.userid;

    if (!["inc", "dec"].includes(incOrDecFlag)) {
      throw new Error("Increment(inc) or Decrement(dec) flag not provided!!");
    }

    const product = await Product.findById(productId);
    if (!product) {
      throw new Error("Product not found");
    }

    let bag = await Bag.findOne({
      user: userId,
    });

    if (!bag) {
      throw new Error("Product is not added to bag yet!!");
    }

    const itemIndex = bag.items.findIndex((item) =>
      item.product.equals(productId)
    );

    if (itemIndex !== -1) {
      if (incOrDecFlag === "inc") {
        if (bag.items[itemIndex].quantity + 1 > product.countInStock) {
          throw new Error("cannot add more than stock");
        }
        bag.items[itemIndex].quantity += 1;
        bag.totalAmount += product.sellPrice;
      } else {
        bag.items[itemIndex].quantity -= 1;
        bag.totalAmount -= product.sellPrice;
      }
    } else {
      throw new Error("Product not added in Bag yet!!");
    }

    bag = await bag.save();

    res.status(202).json({
      success: true,
      message: "Success!",
      newItem: bag,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function removeFromBag(req, res) {
  try {
    const productId = req.body.productId;
    const userId = req.user.userid;

    const product = await Product.findById(productId);
    if (!product) {
      throw new Error("Product not found");
    }

    let bag = await Bag.findOne({ user: userId, "items.product": productId });

    if (!bag) {
      throw new Error("Product not found in bag");
    }

    const itemQuantity = bag.items.find((item) =>
      item.product.equals(productId)
    ).quantity;

    bag.totalAmount -= product.sellPrice * itemQuantity;

    bag.items.pull({ product: productId });

    bag = await bag.save({ new: true });

    res.status(202).json({
      success: true,
      message: "Success!",
      newItem: bag,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function getProduct(req, res) {
  try {
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
      throw new Error("product not found in bag!!");
    }

    const item = bag.items.find((item) => item.product.equals(productId));

    res.status(202).json({
      success: true,
      message: "Success!",
      item,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function getProducts(req, res) {
  try {
    const userId = req.user.userid;

    const data = await Bag.findOne({
      user: userId,
    }).populate({
      path: "items.product",
      select: "name sellPrice image countInStock",
    });

    if (!data || !data.items.length) {
      throw new Error("No products in bag");
    }

    res.status(202).json({
      success: true,
      message: "Success!",
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function getTotalAmount(req, res) {
  try {
    const userId = req.user.userid;

    const bag = await Bag.findOne({
      user: userId,
    });

    if (!bag) {
      throw new Error("Product not found!!");
    }

    res.status(202).json({
      success: true,
      message: "Success!",
      totalAmount: bag.totalAmount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  addProduct,
  incrementOrDecrementProduct,
  removeFromBag,
  getProduct,
  getProducts,
  getTotalAmount,
};
