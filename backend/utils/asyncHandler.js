function asyncHandler(fn) {
  return async function (req, res, next) {
    try {
      await fn(req, res, next);
    } catch (error) {
      console.log(error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message,
      });
    }
  };
}

module.exports = asyncHandler;
