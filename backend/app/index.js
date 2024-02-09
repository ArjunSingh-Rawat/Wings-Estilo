const express = require("express");
const path = require("path");
const { sellCategories, rentCategories, publicPages } = require("../constants");
const Product = require("../api/models/productModel");
const User = require("../api/models/userModel");
const {
  verifyTokenForStaticRoute,
} = require("../api/middleware/authMiddlewares");

const router = express.Router();

for (const page in publicPages) {
  router.get(`/${page}`, (req, res) => {
    res.render(`pages/${publicPages[page]}`);
  });
}

router.get("/profile", verifyTokenForStaticRoute, (req, res) => {
  if (req.error) {
    res.redirect("/?logged=n");
  } else {
    res.render("pages/profile");
  }
});

router.get("/sell/:path", (req, res, next) => {
  if (sellCategories.includes(req.params.path)) {
    const categoryName = req.params.path.split("-").join(" ").toUpperCase();

    res.render("pages/product", {
      categoryName: categoryName,
    });
  } else {
    next();
  }
});

router.get("/rent/:path", (req, res, next) => {
  if (rentCategories.includes(req.params.path)) {
    const categoryName = req.params.path.split("-").join(" ").toUpperCase();
    res.render("pages/product", {
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
    res.render("pages/buy", {
      _id: product._id,
      name: product.name,
      sellPrice: product.sellPrice,
      rentPrice: product.rentPrice,
      shortDescription: product.shortDescription,
      description: product.description,
      image: product.image,
      images: product.images,
      isProductInWishlist,
      rentOrSell: req.params.rentOrSell,
    });
  } catch (error) {
    next();
  }
});

router.get("/admin", (req, res) => {
  res.render("pages/admin/admin");
});

router.get("/admin.css", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../frontend/views/pages/admin/", "admin.css")
  );
});

router.get("/admin.js", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../frontend/views/pages/admin/", "admin.js")
  );
});

module.exports = router;
