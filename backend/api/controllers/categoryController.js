const Category = require("../models/categoryModel");
const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/apiError");

const addNewCategory = asyncHandler(async (req, res) => {
  let category = new Category({
    categoryName: req.body.categoryName,
    isParentCategory: req.body.isParentCategory,
  });
  category = await category.save();
  res.status(200).json({
    success: true,
    message: "success!",
    newCategory: category,
  });
});

const addNewSubCategory = asyncHandler(async (req, res) => {
  if (!req.body.subCategory) {
    throw new ApiError(400, "Sub Category Id not provided!");
  }
  const category = await Category.findOneAndUpdate(
    { _id: req.params.id },
    { $push: { subCategory: req.body.subCategory } },
    { new: true }
  );
  res.status(202).json({
    success: true,
    message: "Success!",
    newItem: category,
  });
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOneAndUpdate(
    { _id: req.params.id },
    {
      categoryName: req.body.categoryName,
      isParentCategory: req.body.isParentCategory,
    },
    { new: true }
  );
  res.status(202).json({
    success: true,
    message: "Success!",
    newItem: category,
  });
});

const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isParentCategory: true }).select(
    "categoryName"
  );
  res.status(200).json({
    success: true,
    message: "success!",
    categories,
  });
});

const getSubCategories = asyncHandler(async (req, res) => {
  const categories = await Category.findOne({ _id: req.params.id })
    .populate("subCategory", "categoryName")
    .select("subCategory");
  res.status(200).json({
    success: true,
    message: "success!",
    subCategories: categories.subCategory,
  });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const deletedCategory = await Category.findOneAndDelete({
    _id: req.params.id,
  });
  res.status(200).json({
    success: true,
    message: "success!",
    deletedCategory: deletedCategory,
  });
});

const deleteSubCategory = asyncHandler(async (req, res) => {
  await Category.findOneAndUpdate(
    { _id: req.body.parentCategoryId },
    { $pull: { subCategory: req.params.id } }
  );

  const deletedCategory = await Category.findOneAndDelete({
    _id: req.params.id,
  });

  res.status(200).json({
    success: true,
    message: "success!",
    deletedCategory: deletedCategory,
  });
});

module.exports = {
  addNewCategory,
  addNewSubCategory,
  updateCategory,
  getAllCategories,
  getSubCategories,
  deleteCategory,
  deleteSubCategory,
};
