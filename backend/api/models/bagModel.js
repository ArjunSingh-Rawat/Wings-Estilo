const mongoose = require("mongoose");

const bagItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productSize: {
      type: String,
      enum: ["xs", "s", "m", "l", "xl", "xxl", "3xxl"],
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: [1, "should not be less than 1 got {VALUE}"],
      required: true,
    },
  },
  { _id: false }
);

const bagSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    unique: true,
  },
  items: [bagItemSchema],
  totalAmount: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("Bag", bagSchema);
