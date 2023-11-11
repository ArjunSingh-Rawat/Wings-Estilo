const express = require("express");
const {
  addNewProduct,
  updateProduct,
  deleteProduct,
  getOneProduct,
  getAllProducts,
} = require("../controllers/productController");

const router = express.Router();

router.post("/", addNewProduct);

router.put("/:id", updateProduct);

router.delete("/:id", deleteProduct);

router.get("/:id", getOneProduct);

router.get("/", getAllProducts);

router.post("/get/upload", (req, res) => {
  console.log(req.body);
  res.end();
});

module.exports = router;
