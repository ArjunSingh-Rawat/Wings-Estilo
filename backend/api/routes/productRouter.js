const express = require("express");
const {
  addNewProduct,
  updateProduct,
  deleteProduct,
  getOneProduct,
  getAllProducts,
  getProductsByCategory,
  getProductsByCategoryForAdmin,
  getSimilarCategoryProducts,
} = require("../controllers/productController");

const { authorizeAdminUser } = require("../middleware/authMiddlewares");

const multer = require("multer");
const upload = multer();

const router = express.Router();

router.post("/", authorizeAdminUser, upload.array("file", 10), addNewProduct);

router.put("/:id", authorizeAdminUser, upload.array("file", 10), updateProduct);

router.delete("/:id", authorizeAdminUser, deleteProduct);

router.get("/:id", getOneProduct);

router.get("/", getAllProducts);

router.get("/category/:categoryId/admin", getProductsByCategoryForAdmin);

router.get("/category/:name/:rentOrSell", getProductsByCategory);

router.get("/similar/:rentOrSell/:productId", getSimilarCategoryProducts);

module.exports = router;
