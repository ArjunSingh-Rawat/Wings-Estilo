const express = require("express");
const path = require("path");
const {
  sellCategories,
  rentCategories,
  publicPages,
  policyPages,
  useFileFrom,
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

router.get("/sell/:path", (req, res, next) => {
  if (sellCategories.includes(req.params.path)) {
    const categoryName = req.params.path.split("-").join(" ").toUpperCase();

    res.render("pages/products", {
      categoryName: categoryName,
    });
  } else {
    next();
  }
});

router.get("/rent/:path", (req, res, next) => {
  if (rentCategories.includes(req.params.path)) {
    const categoryName = req.params.path.split("-").join(" ").toUpperCase();
    res.render("pages/products", {
      categoryName: categoryName,
    });
  } else {
    next();
  }
});

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

module.exports = router;
