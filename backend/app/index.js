const express = require("express");
const path = require("path");
const { sellCategories, rentCategories, publicPages } = require("../constants");
const Product = require("../api/models/productModel");
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

router.get("/:name/:id/buy", async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
    });
    const { _id, name, price, description, image, images } = product;

    res.render("pages/buy", {
      _id,
      name,
      price,
      description,
      image,
      images,
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
