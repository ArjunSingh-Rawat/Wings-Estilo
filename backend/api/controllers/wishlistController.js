const User = require("../models/userModel");
const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/apiError");

const addProduct = asyncHandler(async (req, res) => {
  const productId = req.body.productId;

  if (!productId) {
    throw new ApiError(400, "product id not provided!");
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

  res.status(201).json({
    success: true,
    message: "Success!",
    data: user,
  });
});

const getWishlistItems = asyncHandler(async (req, res) => {
  const user = req.user.userid;

  const data = await User.findOne({ _id: user })
    .populate("wishList")
    .select("wishList -_id");

  if (!data || !data.wishList.length) {
    throw new ApiError(404, "Wishlist is empty!");
  }
  res.status(200).json({
    success: true,
    message: "Success!",
    data: data.wishList,
  });
});

const deleteWishlistItems = asyncHandler(async (req, res) => {
  const user = req.user.userid;
  const productId = req.body.productId;

  if (!productId) {
    throw new ApiError(400, "product id not provided!");
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
    throw new ApiError(404, "Wishlist is empty!");
  }

  res.status(204).json({
    success: true,
    message: "Successfully removed item from wishlist!",
    data: wishList,
  });
});

module.exports = { getWishlistItems, addProduct, deleteWishlistItems };
