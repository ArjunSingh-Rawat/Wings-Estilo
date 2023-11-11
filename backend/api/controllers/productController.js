const Product = require("../models/productModel");

async function addNewProduct(req, res) {
  let product = new Product({
    name: req.body.name,
    price: req.body.price,
    description: req.body.description,
    image: req.body.image,
    category: req.body.category,
    countInStock: req.body.countInStock,
    isOnRent: req.body.isOnRent,
  });
  try {
    await product.save();
    res.status(201).json({
      succsess: true,
      message: "Success!",
      newItem: product,
    });
  } catch (error) {
    res.status(500).json({
      succsess: false,
      message: error.message,
    });
  }
}

async function updateProduct(req, res) {
  try {
    const updateData = {};
    for (const fieldToUpdate in req.body) {
      updateData[fieldToUpdate] = req.body[fieldToUpdate];
    }
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id },
      updateData,
      { new: true }
    );
    res.status(202).json({
      succsess: true,
      message: "Success!",
      newItem: product,
    });
  } catch (error) {
    res.status(500).json({
      succsess: false,
      message: error.message,
    });
  }
}

async function deleteProduct(req, res) {
  try {
    const deletedProduct = await Product.findOneAndDelete({
      _id: req.params.id,
    });
    res.status(200).json({
      succsess: true,
      message: "Delete success!",
      deletedProduct: deletedProduct,
    });
  } catch (error) {
    res.status(500).json({
      succsess: false,
      message: error.message,
    });
  }
}

async function getOneProduct(req, res) {
  try {
    const product = await Product.findOne({ _id: req.params.id });
    res.status(200).json({
      succsess: true,
      message: "success!",
      product: product,
    });
  } catch (error) {
    res.status(500).json({
      succsess: false,
      message: error.message,
    });
  }
}

async function getAllProducts(req, res) {
  try {
    const products = await Product.find();
    res.status(200).json({
      succsess: true,
      message: "success!",
      products: products,
    });
  } catch (error) {
    res.status(500).json({
      succsess: false,
      message: error.message,
    });
  }
}

module.exports = {
  addNewProduct,
  updateProduct,
  deleteProduct,
  getOneProduct,
  getAllProducts,
};
