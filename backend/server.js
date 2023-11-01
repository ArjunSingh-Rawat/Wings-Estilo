const express = require("express");
const path = require("path");
const app = express();

const images_router = require("./routes/images.router");
const static_router = require("./routes/static.router");

app.use(express.static(path.join(__dirname, "../frontend/public")));

app.set("views", path.join(__dirname, "../frontend/views"));
app.set("view engine", "ejs");

app.use("/image", images_router);
app.use("/", static_router);

app.get("/", function (req, res) {
    res.render("pages/homepage");
});

app.listen(5000);
