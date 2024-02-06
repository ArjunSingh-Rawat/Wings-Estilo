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
    const imageObj = await addImage(
      req.files,
      req.body.category,
      req.body.name
    );

    let categories = [req.body.category];
    if (req.body.subCategory) categories.push(req.body.subCategory);

    const { xs, s, m, l, xl, xxl, countInStock } = req.body;

    if (+countInStock !== +xs + +s + +m + +l + +xl + +xxl) {
      throw new Error("Stock not matching with total quantity of sizes!");
    }

    let product = new Product({
      name: req.body.name,
      shortDescription: req.body.shortDescription,
      description: req.body.description,
      sellPrice: req.body.sellPrice,
      rentPrice: req.body.rentPrice,
      image: imageObj.images[0],
      images: imageObj.images.splice(1),
      category: categories,
      countInStock: req.body.countInStock,
      sizeAvailable: {
        xs: req.body.xs,
        s: req.body.s,
        m: req.body.m,
        l: req.body.l,
        xl: req.body.xl,
        xxl: req.body.xxl,
      },
    });

    await product.save();

    await saveImage(req.files, imageObj.imageNames, imageObj.folderPath);

    res.status(201).json({
      success: true,
      message: "Success!",
      newItem: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function addImage(files, categoryId, productName, indexes) {
  try {
    const category = await Category.findOne({ _id: categoryId }).select(
      "categoryName -_id"
    );
    const categoryName = category.categoryName;
    const folderPath = path.join(imageFolderPath + `${categoryName}`);

    let i = 0;
    let j = 0;
    let images = [];
    let imageNames = [];
    if (indexes) {
      indexes.sort();
    }
    for (const file of files) {
      if (indexes) {
        i = indexes[j];
      }
      const imageName = `${Date.now()}-${productName
        .split(" ")
        .join("-")}-${i}.${file.originalname.split(".").pop()}`;

      imageNames.push(imageName);

      imagePath = `/Images/${categoryName}/${imageName}`;
      images.push(imagePath);

      i++;
      j++;
    }
    return {
      images,
      imageNames,
      folderPath,
    };
  } catch (error) {
    throw error;
  }
}

async function saveImage(files, fileNames, folderPath) {
  try {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath);
    }
    let i = 0;
    for (const file of files) {
      const imagePath = path.join(folderPath, `${fileNames[i]}`);
      fs.writeFileSync(imagePath, file.buffer);
      i++;
    }
  } catch (error) {
    throw error;
  }
}

async function updateProduct(req, res) {
  try {
    const productFields = Object.keys(Product.schema.obj);
    const sizeFields = Object.keys(Product.schema.obj.sizeAvailable.obj);
    const fieldsToUpdate = {};
    const sizeFieldsToUpdate = {};

    for (const field in req.body) {
      if (productFields.includes(field)) {
        fieldsToUpdate[field] = req.body[field];
      }
      if (sizeFields.includes(field)) {
        sizeFieldsToUpdate[field] = req.body[field];
      }
    }

    const product = await Product.findOne({ _id: req.params.id }).populate(
      "category"
    );

    if (!product) {
      throw new Error("Product not found!");
    }
    if (req.files.length) {
      const { deletedMainImage, deletedSmallImages } = await deleteImages(
        product.category,
        product.image,
        product.images,
        req.body.indexes
      );

      if (deletedMainImage) product.image = "";
      product.images = product.images.filter(
        (image) => !deletedSmallImages.includes(image)
      );
    }

    const imageObj = await addImage(
      req.files,
      req.body.category,
      req.body.name,
      req.body.indexes
    );

    function compareImageNames(a, b) {
      const regex = /(\d+)\./;
      const numA = parseInt(a.match(regex)[1]);
      const numB = parseInt(b.match(regex)[1]);
      return numA - numB;
    }

    if (req.body.indexes[0] === "0") {
      console.log("inside if", req.body.indexes);
      product.image = imageObj.images[0];
      product.images = [...product.images, ...imageObj.images.splice(1)];
      product.images.sort(compareImageNames);
      console.log("product images after sort", product.images);
    } else {
      console.log("inside else");
      product.images = [...product.images, ...imageObj.images];
      product.images.sort(compareImageNames);
      console.log("product images after sort", product.images);
    }

    for (const field in fieldsToUpdate) {
      product[field] = fieldsToUpdate[field];
    }
    for (const sizeField in sizeFieldsToUpdate) {
      product.sizeAvailable[sizeField] = sizeFieldsToUpdate[sizeField];
    }

    await product.save();

    if (req.files.length) {
      await saveImage(req.files, imageObj.imageNames, imageObj.folderPath);
    }

    res.status(202).json({
      success: true,
      message: "Success!",
      newItem: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function deleteProduct(req, res) {
  try {
    const deletedProduct = await Product.findOneAndDelete({
      _id: req.params.id,
    }).populate("category");

    await deleteImages(
      deletedProduct.category,
      deletedProduct.image,
      deletedProduct.images
    );

    res.status(200).json({
      success: true,
      message: "Delete success!",
      deletedProduct: deletedProduct,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function deleteImages(categories, image, images, indexes) {
  try {
    const parentCategory = categories.find((obj) => obj.isParentCategory);
    const folderPath = imageFolderPath + parentCategory.categoryName;

    const allImages = [image, ...images];
    const deletedSmallImages = [];
    const deletedMainImage = "";

    if (indexes) {
      console.log("delete by index \n*** allImages:", allImages);
      for (const image of allImages) {
        const imageName = image.split("/").pop();
        const imageIndex = imageName.split("-").pop().split(".")[0];
        if (indexes.includes(imageIndex)) {
          const imagePath = folderPath + "\\" + imageName;
          fs.unlinkSync(imagePath);
          if (imageIndex === 0) {
            deletedMainImage = image;
          } else {
            deletedSmallImages.push(image);
          }
        }
      }
      return { deletedMainImage, deletedSmallImages };
    }

    if (fs.existsSync(folderPath)) {
      console.log("delete all", image, images, "indexes:", indexes);
      if (image) {
        const imagePath = folderPath + "\\" + image.split("/").pop();
        fs.unlinkSync(imagePath);
      }
      if (images.length) {
        for (const image of images) {
          const imagePath = folderPath + "\\" + image.split("/").pop();
          fs.unlinkSync(imagePath);
        }
      }
    }
  } catch (error) {
    throw error;
  }
}

async function getOneProduct(req, res) {
  try {
    const product = await Product.findOne({ _id: req.params.id });
    res.status(200).json({
      success: true,
      message: "success!",
      product: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function getAllProducts(req, res) {
  try {
    const products = await Product.find().populate("category");
    res.status(200).json({
      success: true,
      message: "success!",
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function getProductsByCategory(req, res) {
  try {
    const categoryName = req.params.name;

    const categoryId = await Category.findOne({ categoryName }).select("_id");

    const products = await Product.find({
      category: categoryId,
    });

    if (!products || !products.length) {
      throw new Error("No products found!!");
    }

    res.status(200).json({
      success: true,
      message: "success!",
      products,
      quantity: products.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
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
  getProductsByCategory,
};
