const rateLimit = require("express-rate-limit");
const MongoStore = require("rate-limit-mongo");

const url = process.env.mongo_uri;

const apiRateLimitTime = 5 * 60 * 1000;
const pagesRateLimitTime = 5 * 60 * 1000;

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

module.exports = {
  apiRateLimitMiddleware,
  staticPageRateLimitMiddleware,
};
