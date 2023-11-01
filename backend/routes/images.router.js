const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

router.get("/:path/:img_id", (req, res) => {
    const img = fs.readFileSync(
        path.join(
            __dirname,
            `../images/${req.params.path}/${req.params.img_id}`
        )
    );
    res.send(img);
});

module.exports = router;
