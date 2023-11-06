const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const { isUserLogedIn } = require("./api/middleware/authMiddlewares");

require("dotenv").config("./.env");
require("./db/connection");

const PORT = process.env.PORT || 5000;

const app = express();

const imagesRouter = require("./routes/images.router");
const staticRouter = require("./routes/static.router");
const userRouter = require("./api/routes/userRouter");

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "../frontend/public")));
app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "../frontend/views"));

app.use("/", isUserLogedIn, staticRouter);
app.use("/image", imagesRouter);
app.use("/api/users", userRouter);

app.listen(PORT, () =>
  console.log(`server started on http://localhost:${PORT}`)
);
