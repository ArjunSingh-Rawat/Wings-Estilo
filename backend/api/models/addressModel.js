const mongoose = require("mongoose");
const { stateNames } = require("../../constants");

const addressSchema = new mongoose.Schema({
  defaultAddress: {
    type: Boolean,
    required: true,
    default: false,
  },
  name: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: Number,
    required: true,
    validate: {
      validator: function (value) {
        return /^\d{10}$/.test(value);
      },
      message: "Phone number must be 10 digits long.",
    },
  },
  pinCode: {
    type: Number,
    required: true,
    validate: {
      validator: function (value) {
        return /^\d{6}$/.test(value);
      },
      message: "PIN code must be 6 digits long.",
    },
  },
  addressLine1: {
    type: String,
    required: true,
  },
  addressLine2: {
    type: String,
    required: true,
  },
  district: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
    enum: stateNames,
  },
});

module.exports = mongoose.model("Address", addressSchema);
