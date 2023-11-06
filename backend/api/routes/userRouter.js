const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { verifyToken } = require("../middleware/authMiddlewares");

const router = express.Router();

router.get("/", async (req, res) => {
    let users = await User.find().select("-password");
    if (!users) {
        res.status(500).json("no users registerd yet!!");
    }
    res.send(users);
});

router.post("/register", async (req, res) => {
    const newUser = new User({
        fullname: req.body.fullname,
        email: req.body.email,
        phonenumber: req.body.phonenumber,
        password: bcrypt.hashSync(req.body.password, 8),
    });

    try {
        const savedUser = await newUser.save();
        res.status(201).json(savedUser);
    } catch (err) {
        console.log(err);
        res.status(401).json(err);
    }
});

router.post("/login", async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email }).select(
            "-password"
        );
        if (!user) {
            return res.status(400).send("user not found!");
        }

        const token = jwt.sign(
            {
                userid: user._id,
                email: user.email,
            },
            process.env.JWT_SECRET
        );
        const expireTime = new Date();
        expireTime.setSeconds(expireTime.getSeconds() + 50);
        res.cookie("jswet", token, {
            expires: expireTime,
            httpOnly: true,
        });
        res.status(200).json("ok!");
    } catch (error) {
        console.log(error);
    }
});

router.get("/logout", (req, res) => {
    res.clearCookie("jswet");
    res.redirect("/");
});

router.get("/:id", verifyToken, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id }).select(
            "-password"
        );
        if (!user) {
            return res.status(404).json("user not found!");
        }
        res.status(200).json(user);
    } catch (error) {
        console.log(error);
        res.status(402).json("bad request", error);
    }
});

module.exports = router;
