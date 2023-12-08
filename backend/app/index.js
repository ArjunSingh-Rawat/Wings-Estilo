const express = require("express");
const path = require("path");

const { categories } = require("../constants");

const router = express.Router();

let categoryNmaes = {
  gowns: "GOWNS",
  mgowns: "MATERNITY GOWNS",
  kids: "KIDS DRESSES",
};

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

router.get("/:path/products", (req, res, next) => {
  let requestedPath = req.params.path;

  const extension = path.extname(requestedPath);
  if (extension !== ".json") {
    requestedPath += ".json";
  }

  const safePath = path.join(__dirname, "../db", requestedPath);

  try {
    const data = require(safePath);
    res.json(data);
  } catch (error) {
    next();
  }
});

router.get("/:category/:title/:name/:id/buy", (req, res) => {
  let products = require(`../db/${req.params.category}`);

  let imageSrc = "";

  for (const item of products) {
    if (item.id === +req.params.id) {
      imageSrc = item.image[0];
      break;
    }
  }

  res.render("pages/buy", {
    imagePath: imageSrc,
  });
});

module.exports = router;
