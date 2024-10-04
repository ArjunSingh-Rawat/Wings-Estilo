const ApiError = require("./apiError");

function validatePhoneNumber(phoneNumber) {
  const phoneNumberRegex = /^\d+$/;

  if (!phoneNumber) {
    throw new ApiError(406, "Phone number must be provided!");
  }

  if (!phoneNumberRegex.test(phoneNumber)) {
    throw new ApiError(
      406,
      "Phone number is not valid. Only digits are allowed."
    );
  }

  if (phoneNumber.length !== 10) {
    throw new ApiError(406, "Phone number length must be 10 digits.");
  }
}

module.exports = validatePhoneNumber;
