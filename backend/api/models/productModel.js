const mongoose = require("mongoose");

const sizeSchema = new mongoose.Schema(
  {
    xs: {
      type: Number,
      min: [0, "should not be less than 0 got {VALUE}"],
      required: true,
    },
    s: {
      type: Number,
      min: [0, "should not be less than 0 got {VALUE}"],
      required: true,
    },
    m: {
      type: Number,
      min: [0, "should not be less than 0 got {VALUE}"],
      required: true,
    },
    l: {
      type: Number,
      min: [0, "should not be less than 0 got {VALUE}"],
      required: true,
    },
    xl: {
      type: Number,
      min: [0, "should not be less than 0 got {VALUE}"],
      required: true,
    },
    xxl: {
      type: Number,
      min: [0, "should not be less than 0 got {VALUE}"],
      required: true,
    },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    sellPrice: {
      type: Number,
      min: [0, "should not be less than 0 got {VALUE}"],
      required: true,
    },
    rentPrice: {
      type: Number,
      min: [0, "should not be less than 0 got {VALUE}"],
      required: true,
    },
    shortDescription: {
      type: String,
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
      min: [0, "should not be less than 0 got {VALUE}"],
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
    forRent: {
      type: Boolean,
      require: true,
    },
    forSell: {
      type: Boolean,
      require: true,
    },
    sizeAvailable: sizeSchema,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
