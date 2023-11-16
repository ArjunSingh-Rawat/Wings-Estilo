const express = require("express");
const {
  addNewProduct,
  updateProduct,
  deleteProduct,
  getOneProduct,
  getAllProducts,
} = require("../controllers/productController");

const multer = require("multer");
const upload = multer();

const router = express.Router();

router.post("/", upload.array("file", 10), addNewProduct);

router.put("/:id", updateProduct);

router.delete("/:id", deleteProduct);

router.get("/:id", getOneProduct);

router.get("/", getAllProducts);

module.exports = router;
