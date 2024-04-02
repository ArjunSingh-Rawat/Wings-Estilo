const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const fs = require("fs");
const path = require("path");
const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/apiError");
const {
  uploadOnCloudinary,
  deleteFromCloudinary,
} = require("../../utils/cloudinary");
const { useFileFrom } = require("../../constants");

const imageFolderPath = path.join(
  __dirname,
  "../../../frontend/public/Images/"
);

/*---------------- controller functions --------------*/

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
    if (indexes.length) {
      indexes.sort();
    }
    for (const file of files) {
      if (indexes.length) {
        i = indexes[j];
      }
      const fileType =
        file.originalname.split(".").pop() === "jpeg"
          ? "jpg"
          : file.originalname.split(".").pop();

      const imageName = `${Date.now()}-${productName
        .split(" ")
        .join("-")}-${i}.${fileType}`;

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
    const imagePaths = [];
    for (const file of files) {
      const imagePath = path.join(folderPath, `${fileNames[i]}`);
      fs.writeFileSync(imagePath, file.buffer);
      imagePaths.push(imagePath);
      i++;
    }
    return imagePaths;
  } catch (error) {
    throw error;
  }
}

async function deleteImages(parentCategory, image, images, indexes) {
  try {
    const folderPath = imageFolderPath + parentCategory.categoryName;

    const allImages = [image, ...images];
    const deletedSmallImages = [];
    const deletedMainImage = "";
    if (indexes.length) {
      for (const image of allImages) {
        const imageName = image.split("/").pop();
        const imageIndex = imageName.split("-").pop().split(".")[0];
        if (indexes.includes(imageIndex)) {
          const imagePath = folderPath + "\\" + imageName;
          fs.unlinkSync(imagePath);

          await deleteImageFromCloudinary(image);
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
      if (image) {
        const imagePath = folderPath + "\\" + image.split("/").pop();
        fs.unlinkSync(imagePath);

        await deleteImageFromCloudinary(image);
      }
      if (images.length) {
        for (const image of images) {
          const imagePath = folderPath + "\\" + image.split("/").pop();
          fs.unlinkSync(imagePath);

          await deleteImageFromCloudinary(image);
        }
      }
    }
  } catch (error) {
    throw error;
  }
}

async function deleteImageFromCloudinary(image) {
  const public_id = image.split(".")[0].split("/").splice(2).join("/");
  await deleteFromCloudinary(public_id);
}

async function uploadImagesOnCloudinary(imagePaths, imageLinkPaths) {
  imagePathsToStore = [];
  let i = 0;
  for (const file of imagePaths) {
    const publicIdForCloudinary = imageLinkPaths[i]
      .split(".")[0]
      .split("/")
      .splice(1)
      .join("/");
    const secure_url = await uploadOnCloudinary(file, publicIdForCloudinary);
    imagePathsToStore.push(secure_url.split("upload")[1]);
    i++;
  }
  return imagePathsToStore;
}

/*------------ controllers --------------*/
const addNewProduct = asyncHandler(async (req, res) => {
  const imageObj = await addImage(
    req.files,
    req.body.category,
    req.body.name,
    [] // empty image indexes array,since we are adding new product
  );

  let categories = [req.body.category];
  if (req.body.subCategory) categories.push(req.body.subCategory);

  const { xs, s, m, l, xl, xxl, threeXl } = req.body;
  const countInStock = +xs + +s + +m + +l + +xl + +xxl + +threeXl;

  if (
    !["true", "false"].includes(req.body.forSell) ||
    !["true", "false"].includes(req.body.forRent)
  ) {
    throw new ApiError(400, "forSell and forRent value should be true/false");
  }

  let product = new Product({
    name: req.body.name,
    shortDescription: req.body.shortDescription,
    description: req.body.description,
    forSell: req.body.forSell,
    forRent: req.body.forRent,
    sellPrice: req.body.forSell === "true" ? req.body.sellPrice : 0,
    rentPrice: req.body.forRent === "true" ? req.body.rentPrice : 0,
    category: categories,
    countInStock,
    sizeAvailable: {
      xs: req.body.xs,
      s: req.body.s,
      m: req.body.m,
      l: req.body.l,
      xl: req.body.xl,
      xxl: req.body.xxl,
      threeXl: req.body.threeXl,
    },
  });

  const imagePaths = await saveImage(
    req.files,
    imageObj.imageNames,
    imageObj.folderPath
  );
  const imagePathsToStore = await uploadImagesOnCloudinary(
    imagePaths,
    imageObj.images
  );
  product.image = imagePathsToStore[0];
  product.images = imagePathsToStore.splice(1);

  await product.save();

  res.status(201).json({
    success: true,
    message: "Success!",
    newItem: product,
  });
});

const updateProduct = asyncHandler(async (req, res) => {
  const productFields = Object.keys(Product.schema.obj);
  const sizeFields = Object.keys(Product.schema.obj.sizeAvailable.obj);
  const fieldsToUpdate = {};
  const sizeFieldsToUpdate = {};

  for (const field in req.body) {
    if (productFields.includes(field)) {
      if (field !== "category") fieldsToUpdate[field] = req.body[field];
    }
    if (sizeFields.includes(field)) {
      sizeFieldsToUpdate[field] = req.body[field];
    }
  }

  const product = await Product.findOne({ _id: req.params.id }).populate(
    "category"
  );

  if (!product) {
    throw new ApiError(404, "Product not found!");
  }
  const indexes = req.body.indexes ? [...req.body.indexes] : [];

  const parentCategory = product.category.find((obj) => obj.isParentCategory);
  let imageObj = "";
  if (indexes.length) {
    const { deletedMainImage, deletedSmallImages } = await deleteImages(
      parentCategory,
      product.image,
      product.images,
      indexes
    );
    if (deletedMainImage) product.image = "";
    product.images = product.images.filter(
      (image) => !deletedSmallImages.includes(image)
    );

    if (req.files.length) {
      imageObj = await addImage(
        req.files,
        parentCategory._id,
        req.body.name,
        indexes
      );
      const imagePaths = await saveImage(
        req.files,
        imageObj.imageNames,
        imageObj.folderPath
      );
      const imagePathsToStore = await uploadImagesOnCloudinary(
        imagePaths,
        imageObj.images
      );

      function compareImageNames(a, b) {
        const regex = /(\d+)\./;
        const numA = parseInt(a.match(regex)[1]);
        const numB = parseInt(b.match(regex)[1]);
        return numA - numB;
      }

      if (indexes[0] === "0") {
        product.image = imagePathsToStore[0];
        product.images = [...product.images, ...imagePathsToStore.splice(1)];
        product.images.sort(compareImageNames);
      } else {
        product.images = [...product.images, ...imagePathsToStore];
        product.images.sort(compareImageNames);
      }
    }
  }

  for (const field in fieldsToUpdate) {
    product[field] = fieldsToUpdate[field];
  }
  for (const sizeField in sizeFieldsToUpdate) {
    product.sizeAvailable[sizeField] = sizeFieldsToUpdate[sizeField];
  }

  await product.save();
  res.status(202).json({
    success: true,
    message: "Success!",
    newItem: product,
  });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const deletedProduct = await Product.findOneAndDelete({
    _id: req.params.id,
  }).populate("category");

  const parentCategory = deletedProduct.category.find(
    (obj) => obj.isParentCategory
  );
  await deleteImages(
    parentCategory,
    deletedProduct.image,
    deletedProduct.images,
    [] // empty indexes array since are deleting all images
  );

  res.status(200).json({
    success: true,
    message: "Delete success!",
    deletedProduct: deletedProduct,
  });
});

const getOneProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id });
  res.status(200).json({
    success: true,
    message: "success!",
    product: product,
  });
});

const getAllProducts = asyncHandler(async (req, res) => {
  const products = await Product.find().populate("category");
  res.status(200).json({
    success: true,
    message: "success!",
    products,
  });
});

const getProductsByCategory = asyncHandler(async (req, res) => {
  const categoryName = req.params.name;
  const rentOrSell = req.params.rentOrSell;
  if (!rentOrSell && ["sell", "rent"].includes(rentOrSell)) {
    throw new ApiError(403, "ren of sell not provided in url path");
  }
  const categoryId = await Category.findOne({ categoryName }).select("_id");

  let products = null;
  if (rentOrSell === "sell") {
    products = await Product.find({
      category: categoryId,
      forSell: true,
    });
  } else if (rentOrSell === "rent") {
    products = await Product.find({
      category: categoryId,
      forRent: true,
    });
  }
  if (!products || !products.length) {
    throw new ApiError(404, "No products found!!");
  }

  for (const product of products) {
    if (useFileFrom === "localFiles") {
      product.image = "/" + product.image.split("/").splice(2).join("/");
    } else if (useFileFrom === "cloudinaryFiles") {
      product.image =
        `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload` +
        product.image;
    }
  }

  https: res.status(200).json({
    success: true,
    message: "success!",
    products,
    quantity: products.length,
  });
});

module.exports = {
  addNewProduct,
  updateProduct,
  deleteProduct,
  getOneProduct,
  getAllProducts,
  getProductsByCategory,
};
