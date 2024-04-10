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
          enum: ["Processing", "Shipped", "Delivered", "canceled"],
          default: "Processing",
        },
        updatedAt: {
          type: Date,
        },
      },
    ],
    orderStatus: {
      type: String,
      enum: ["incomplete", "complete"],
      default: "incomplete",
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    payment: {
      provider: {
        type: String,
        enum: ["Razorpay", "Phonepe"],
        required: true,
      },
      details: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "payment.provider",
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
