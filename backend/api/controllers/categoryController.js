const Category = require("../models/categoryModel");

async function addNewCategory(req, res) {
  try {
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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function addNewSubCategory(req, res) {
  try {
    if (!req.body.subCategory) {
      throw new Error("send sub Category Id");
    }
    const category = await Category.findOneAndUpdate(
      { _id: req.params.id },
      { $push: { subCategory: req.body.subCategory } },
      { new: true }
    );
    res.status(202).json({
      succsess: true,
      message: "Success!",
      newItem: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function updateCategory(req, res) {
  try {
    const category = await Category.findOneAndUpdate(
      { _id: req.params.id },
      {
        categoryName: req.body.categoryName,
        isParentCategory: req.body.isParentCategory,
      },
      { new: true }
    );
    res.status(202).json({
      succsess: true,
      message: "Success!",
      newItem: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function getAllCategories(req, res) {
  try {
    const categories = await Category.find({ isParentCategory: true }).select(
      "categoryName"
    );
    res.status(200).json({
      success: true,
      message: "success!",
      categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function getSubCategories(req, res) {
  try {
    const categories = await Category.findOne({ _id: req.params.id })
      .populate("subCategory", "categoryName")
      .select("subCategory");
    res.status(200).json({
      success: true,
      message: "success!",
      subCategories: categories.subCategory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function deleteCategory(req, res) {
  try {
    const deletedCategory = await Category.findOneAndDelete({
      _id: req.params.id,
    });
    res.status(200).json({
      success: true,
      message: "success!",
      deletedCategory: deletedCategory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function deleteSubCategory(req, res) {
  try {
    console.log("fkasfjsklj;fjkj", req.body.parentCategoryId);
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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  addNewCategory,
  addNewSubCategory,
  updateCategory,
  getAllCategories,
  getSubCategories,
  deleteCategory,
  deleteSubCategory,
};
