const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    images: [
      {
        type: String,
      },
    ],
    category: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
      },
    ],
    countInStock: {
      type: Number,
      required: true,
      min: 0,
    },
    rating: {
      type: Number,
      min: [0, "should not be less than 0 got {VALUE}"],
      max: [5, "should not be more than 5 gor {VALUE}"],
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    rentOrSale: [
      {
        type: String,
        required: true,
        enum: ["sale", "rent"],
      },
    ],
    sizeAvailable: [
      {
        type: String,
        required: true,
        enum: ["xs", "s", "m", "l", "xl", "xxl"],
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
