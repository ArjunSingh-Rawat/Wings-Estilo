const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        productSize: {
          type: String,
          required: true,
        },
        status: {
          type: String,
          enum: ["Pending", "Processing", "Shipped", "Delivered"],
          default: "Pending",
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    payment: {
      provider: {
        type: String,
        enum: ["razorpay", "phonepe"],
        required: true,
      },
      details: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "provider",
      },
    },
    shippingAddress: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
