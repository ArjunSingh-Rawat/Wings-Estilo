const Razor = require("razorpay");
const crypto = require("crypto");
const ApiError = require("./apiError");

const razorInstance = new Razor({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function createRazorpayOrder(amount) {
  try {
    const orderOptions = {
      amount: amount * 100,
      currency: "INR",
    };

    const order = await razorInstance.orders.create(orderOptions);
    if (!order) {
      throw new ApiError(500, "unable to create order!");
    }

    return {
      order,
      key: process.env.RAZORPAY_KEY_ID,
    };
  } catch (error) {
    throw error;
  }
}

function verifyRazorpayPayment(
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature
) {
  try {
    const rawString = razorpay_order_id + "|" + razorpay_payment_id;
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(rawString.toString())
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      throw new ApiError(401, "Invalid Signature!!");
    }
  } catch (error) {
    throw error;
  }
}

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
};
