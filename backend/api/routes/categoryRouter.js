const express = require("express");
const {
  addNewCategory,
  addNewSubCategory,
  updateCategory,
  getAllCategories,
  getSubCategories,
} = require("../controllers/categoryController");

const router = express.Router();

router.post("/", addNewCategory);

router.put("/:id", updateCategory);

router.put("/subCategory/:id", addNewSubCategory);

router.get("/", getAllCategories);

router.get("/:id", getSubCategories);

module.exports = router;
