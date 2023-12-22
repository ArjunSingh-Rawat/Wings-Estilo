const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const {
  setUserInLocalsIfLoggedIn,
} = require("./api/middleware/authMiddlewares");

require("dotenv").config("./.env");
require("./db/connection");

const PORT = process.env.PORT || 5000;

const app = express();

const appRouter = require("./app/index");
const userRouter = require("./api/routes/userRouter");
const categoryRouter = require("./api/routes/categoryRouter");
const productRouter = require("./api/routes/productRouter");
const bagRouter = require("./api/routes/bagRouter");
const wishListRouter = require("./api/routes/wishlistRouter");

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "../frontend/public")));
app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "../frontend/views"));

app.use("/", setUserInLocalsIfLoggedIn, appRouter);
app.use("/api/users", userRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/products", productRouter);
app.use("/api/bag/", bagRouter);
app.use("/api/wishlist", wishListRouter);

app.use((req, res) => {
  if (req.originalUrl.startsWith("/api")) {
    res.status(404).json({
      succsess: false,
      message: "Cannot get what you want to search",
    });
  } else {
    res.status(404).render("pages/404");
  }
});

app.listen(PORT, () =>
  console.log(`server started on http://localhost:${PORT}`)
);
