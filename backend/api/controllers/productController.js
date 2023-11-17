const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const fs = require("fs");
const path = require("path");

const imageFolderPath = path.join(
  __dirname,
  "../../../frontend/public/Images/"
);

async function addNewProduct(req, res) {
  try {
    const images = await addImage(req.files, req.body.category, req.body.name);

    if (images) {
      console.log(images);
      console.log(images.slice(1));
    }

    let categories = [req.body.category];
    categories.push(req.body.subCategory);

    let product = new Product({
      name: req.body.name,
      price: req.body.price,
      description: req.body.description,
      image: images[0],
      category: categories,
      countInStock: req.body.countInStock,
      isOnRent: req.body.isOnRent,
      images: images.splice(1),
    });

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

async function addImage(files, categoryId, productName) {
  try {
    const category = await Category.findOne({ _id: categoryId }).select(
      "categoryName -_id"
    );
    const categoryName = category.categoryName;
    const folderPath = path.join(imageFolderPath + `${categoryName}`);

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath);
    }

    let i = 0;
    let images = [];
    for (const file of files) {
      const imageName = `${Date.now()}-${productName
        .split(" ")
        .join("-")}-${i}.${file.originalname.split(".").pop()}`;

      let imagePath = path.join(folderPath, `${imageName}`);
      fs.writeFileSync(imagePath, file.buffer);
      i++;
      imagePath = `/Images/${categoryName}/${imageName}`;
      images.push(imagePath);
    }
    return images;
  } catch (error) {
    throw error;
  }
}

async function updateProduct(req, res) {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id },
      {
        name: req.body.name,
        price: req.body.price,
        description: req.body.description,
        $push: {
          category: req.body.category,
        },
        rating: req.body.rating,
        countInStock: req.body.countInStock,
        isOnRent: req.body.isOnRent,
      },
      { new: true }
    );

    if (product.validateSync()) {
      const error = product.validateSync();
      throw new Error(error);
    }

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
  console.log(imageFolderPath);
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
