const mongoose = require("mongoose");

const bagItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    quantity: {
      type: Number,
      default: 1,
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
