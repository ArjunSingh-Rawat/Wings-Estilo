const jwt = require("jsonwebtoken");
const User = require("../models/User");

function verifyToken(req, res, next) {
    const token = req.cookies.jswet;
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                res.status(403).json("Token is invalid!");
            }
            req.user = user;
            next();
        });
    } else {
        res.status(401).json("your are not authenticated");
    }
}

async function isUserLogedIn(req, res, next) {
    const token = req.cookies.jswet;

    if (token) {
        let userId;
        jwt.verify(token, process.env.JWT_SECRET, (err, userData) => {
            if (err) res.locals.user = null;
            else userId = userData.userid;
        });

        let user = await User.findOne({ _id: userId }).select("fullname");
        if (user) {
            res.locals.user = user.fullname;
        } else {
            res.locals.user = null;
        }
    } else {
        res.locals.user = null;
    }
    next();
}

module.exports = {
    verifyToken,
    isUserLogedIn,
};
