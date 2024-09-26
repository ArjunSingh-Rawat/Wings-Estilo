const express = require("express");
const Category = require("../api/models/categoryModel");
const path = require("path");
const {
  sellCategories,
  rentCategories,
  publicPages,
  policyPages,
  useFileFrom,
  productLimit,
} = require("../constants");
const Product = require("../api/models/productModel");
const {
  verifyTokenForStaticRoute,
  authorizeAdminUser,
} = require("../api/middleware/authMiddlewares");
const {
  getSelectedProduct,
} = require("../api/middleware/validateProductOrder");

const router = express.Router();

for (const page in publicPages) {
  router.get(`/${page}`, (req, res) => {
    res.render(`pages/${publicPages[page]}`);
  });
}

for (const page in policyPages) {
  router.get(`/${page}`, (req, res) => {
    res.render(`pages/policies/${policyPages[page]}`);
  });
}

router.get("/profile", verifyTokenForStaticRoute, (req, res) => {
  if (req.error) {
    res.redirect("/?logged=n");
  } else {
    res.setHeader("Cache-Control", "no-cache,no-store,must-revalidate");
    res.render("pages/profile");
  }
});

router.get("/sell/:path", handleRentOrSell("sell", sellCategories));
router.get("/rent/:path", handleRentOrSell("rent", rentCategories));

router.get("/:rentOrSell/:name/:id/buy", async (req, res, next) => {
  try {
    let isProductInWishlist = false;
    if (req.userData) {
      for (const item of req.userData.wishList) {
        if (item.toString() === req.params.id) {
          isProductInWishlist = true;
        }
      }
    }
    const product = await Product.findOne({
      _id: req.params.id,
    });

    if (!["sell", "rent"].includes(req.params.rentOrSell)) {
      throw new Error("type sell or rent not provided");
    }

    if (req.params.rentOrSell === "rent" && !product.forRent) {
      throw new Error("Product is not for rent");
    } else if (req.params.rentOrSell === "sell" && !product.forSell) {
      throw new Error("Product is not for sell");
    }

    const images = [];
    if (useFileFrom === "localFiles") {
      product.image = "/" + product.image.split("/").splice(2).join("/");
      for (const image of product.images) {
        images.push("/" + image.split("/").splice(2).join("/"));
      }
    } else if (useFileFrom === "cloudinaryFiles") {
      product.image =
        `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload` +
        product.image;
      for (const image of product.images) {
        images.push(
          `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload` +
            image
        );
      }
    }

    res.render("pages/product", {
      _id: product._id,
      name: product.name,
      sellPrice: product.sellPrice,
      rentPrice: product.rentPrice,
      shortDescription: product.shortDescription,
      description: product.description,
      image: product.image,
      images,
      isProductInWishlist,
      rentOrSell: req.params.rentOrSell,
    });
  } catch (error) {
    next();
  }
});

router.get("/sell/checkout", getSelectedProduct, (req, res) => {
  res
    .setHeader("Cache-Control", "no-cache,no-store,must-revalidate")
    .render("pages/checkout", {
      products: req.products,
      rentOrSell: "sell",
    });
});

router.get("/rent/checkout", getSelectedProduct, (req, res) => {
  res
    .setHeader("Cache-Control", "no-cache,no-store,must-revalidate")
    .render("pages/rentCheckout", {
      products: req.products,
      rentOrSell: "rent",
    });
});

router.get("/admin", authorizeAdminUser, (req, res) => {
  res.render("pages/admin/admin");
});

router.get("/admin.css", authorizeAdminUser, (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../frontend/views/pages/admin/", "admin.css")
  );
});

router.get("/admin.js", authorizeAdminUser, (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../frontend/views/pages/admin/", "admin.js")
  );
});

// functions

function handleRentOrSell(sellOrRent, categoryList) {
  return async (req, res, next) => {
    try {
      if (categoryList.includes(req.params.path)) {
        const categoryName = req.params.path.split("-").join(" ").toUpperCase();
        const pageNumber = parseInt(req.query.page) || 1;

        const { products, totalProducts } = await getProducts(
          req.params.path,
          sellOrRent,
          pageNumber
        );

        const totalPages = Math.ceil(totalProducts / productLimit) || 1;
        if (pageNumber > totalPages || pageNumber <= 0) {
          throw new Error("Products not found!!");
        }

        res.render("pages/products", {
          categoryName: categoryName,
          rentOrSell: sellOrRent,
          products,
          totalPages,
        });
      } else {
        next();
      }
    } catch (error) {
      next(error);
    }
  };
}

async function getProducts(categoryName, sellOrRent, pageNumber) {
  const skipCount = productLimit * (pageNumber - 1);
  const categoryId = await Category.findOne({ categoryName }).select("_id");

  const totalProducts = await Product.countDocuments({
    category: categoryId,
    [sellOrRent === "sell" ? "forSell" : "forRent"]: true,
  });

  const products = await Product.find({
    category: categoryId,
    [sellOrRent === "sell" ? "forSell" : "forRent"]: true,
  })
    .skip(skipCount)
    .limit(productLimit);

  for (const product of products) {
    if (useFileFrom === "localFiles") {
      product.image = "/" + product.image.split("/").splice(2).join("/");
    } else if (useFileFrom === "cloudinaryFiles") {
      product.image =
        `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload` +
        product.image;
    }
  }
  return { products, totalProducts };
}
module.exports = router;
