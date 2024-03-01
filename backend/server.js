const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const {
  setUserInLocalsIfLoggedIn,
  verifyToken,
  authorizeAdminUser,
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
const addressRouter = require("./api/routes/addressRouter");
const orderRouter = require("./api/routes/orderRouter");

app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "../frontend/public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../frontend/views"));

app.use("/", setUserInLocalsIfLoggedIn, appRouter);
app.use("/api/user", userRouter);
app.use("/api/user/addresses", verifyToken, addressRouter);
app.use("/api/categories", authorizeAdminUser, categoryRouter);
app.use("/api/products", productRouter);
app.use("/api/bag/", bagRouter);
app.use("/api/wishlist", wishListRouter);
app.use("/api/order", verifyToken, orderRouter);

app.use((req, res) => {
  res.status(404).render("pages/404");
});

app.use((err, req, res, next) => {
  console.log(err);
  res.status(404).render("pages/404");
});

app.listen(PORT, () =>
  console.log(`server started on http://localhost:${PORT}`)
);
