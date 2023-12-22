const User = require("../models/userModel");

async function addProduct(req, res) {
  try {
    const productId = req.body.productId;

    if (!productId) {
      throw new Error("productId not provided");
    }
    const user = await User.findOneAndUpdate(
      { _id: req.user.userid },
      {
        $addToSet: {
          wishList: req.body.productId,
        },
      },
      { new: true }
    );

    if (!user) {
      throw new Error("unable to add to wishlist");
    }

    res.status(202).json({
      succsess: true,
      message: "Success!",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function getWishlistItems(req, res) {
  try {
    const user = req.user.userid;

    const data = await User.findOne({ _id: user })
      .populate("wishList")
      .select("wishList -_id");

    if (!data || !data.wishList.length) {
      throw new Error("Wishlist is empty");
    }
    res.status(200).json({
      succsess: true,
      message: "Success!",
      data: data.wishList,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function deleteWishlistItems(req, res) {
  try {
    const user = req.user.userid;
    const productId = req.body.productId;

    if (!productId) {
      throw new Error("productId not provided");
    }

    const wishList = await User.findOneAndUpdate(
      { _id: user },
      {
        $pull: {
          wishList: productId,
        },
      },
      { new: true }
    )
      .populate("wishList")
      .select("wishList");

    if (!wishList) {
      throw new Error("Wishlist is empty");
    }

    res.status(200).json({
      succsess: true,
      message: "Success!",
      data: wishList,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = { getWishlistItems, addProduct, deleteWishlistItems };
