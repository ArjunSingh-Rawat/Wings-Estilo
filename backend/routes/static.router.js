const express = require("express");
const path = require("path");

const router = express.Router();

router.get("/login", (req, res) => {
    res.render("pages/login");
});

router.get("/admin", (req, res) => {
    res.render("pages/admin");
});

router.get("/:path", (req, res) => {
    res.render("pages/product");
});

router.get("/:path/products", (req, res) => {
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
        res.status(404).json({ error: "Data not found" });
    }
});

router.get("/:category/:title/:name/:id/buy", (req, res) => {
    let products = require(`../db/gowns`);

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
