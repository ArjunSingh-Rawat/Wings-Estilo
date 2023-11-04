const express = require("express");
const router = express.Router();

const User = require("../models/User");

router.post("/register", async (req, res) => {
    const newUser = new User({
        fullname: req.body.fullname,
        email: req.body.email,
        phonenumber: req.body.phonenumber,
        password: req.body.password,
    });

    try {
        const savedUser = await newUser.save();
        res.status(201).json(savedUser);
    } catch (err) {
        console.log(err);
        res.status(500).json(err);
    }
});

router.post("/login", (req, res) => {});

module.exports = router;
