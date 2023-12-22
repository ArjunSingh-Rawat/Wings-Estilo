const express = require("express");
const path = require("path");
const { categoryNmaes, categories } = require("../constants");
const Product = require("../api/models/productModel");
const { default: mongoose } = require("mongoose");

const router = express.Router();

router.get("/", async function (req, res) {
  res.render("pages/homepage");
});

router.get("/my-bag", (req, res) => {
  res.render("pages/bag");
});

router.get("/my-wishlist", (req, res) => {
  res.render("pages/wishlist");
});

router.get("/about-us", (req, res) => {
  res.render("pages/about");
});

router.get("/login", (req, res) => {
  res.render("pages/login");
});

router.get("/sign-up", (req, res) => {
  res.render("pages/signup");
});

router.get("/profile", (req, res) => {
  res.render("pages/profile");
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

router.get("/:path", (req, res, next) => {
  const categoryName = categoryNmaes[req.params.path];

  if (categories.includes(req.path.split("/")[1])) {
    res.render("pages/product", {
      categoryName: categoryName,
    });
  } else {
    next();
  }
});

router.get("/:name/:id/buy", async (req, res) => {
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
    console.log(error.message);
  }
});

module.exports = router;
