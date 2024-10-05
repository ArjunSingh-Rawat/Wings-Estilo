const rateLimit = require("express-rate-limit");
const MongoStore = require("rate-limit-mongo");

const url = process.env.mongo_uri;

const apiRateLimitTime = 5 * 60 * 1000;
const pagesRateLimitTime = 5 * 60 * 1000;
const otpRateLimitTime = 15 * 60 * 1000;

function staticPageRateLimitMiddleware() {
  return rateLimit({
    windowMs: pagesRateLimitTime,
    max: 450,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return req.headers["x-forwarded-for"] || req.ip || "localhost";
    },

    store: new MongoStore({
      collectionName: "staticPageRateLimit",
      uri: url,
      expireTimeMs: pagesRateLimitTime,
    }),
  });
}

function apiRateLimitMiddleware() {
  return rateLimit({
    windowMs: apiRateLimitTime,
    max: 250,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return req.headers["x-forwarded-for"] || req.ip || "localhost";
    },

    store: new MongoStore({
      collectionName: "apiRateLimit",
      uri: url,
      expireTimeMs: apiRateLimitTime,
    }),
  });
}

function otpRateLimitMiddleware() {
  return rateLimit({
    windowMs: otpRateLimitTime,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return req.headers["x-forwarded-for"] || req.ip || "localhost";
    },

    store: new MongoStore({
      collectionName: "otpRateLimit",
      uri: url,
      expireTimeMs: otpRateLimitTime,
    }),

    handler: (req, res) => {
      const resetTime = Math.ceil(
        (req.rateLimit.resetTime - Date.now()) / 1000 / 60
      );
      res.status(429).json({
        success: false,
        message: `Too many OTP requests. Please try again in ${resetTime} minute${
          resetTime > 1 ? "s" : ""
        }.`,
      });
    },
  });
}

module.exports = {
  apiRateLimitMiddleware,
  staticPageRateLimitMiddleware,
  otpRateLimitMiddleware,
};
