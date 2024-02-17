function validatePhoneNumber(phoneNumber) {
  try {
    const phoneNumberRegex = /^\d+$/;

    if (!phoneNumber) {
      throw new Error("Phone number to provided!");
    }

    if (!phoneNumberRegex.test(phoneNumber)) {
      throw new Error("Phone number is not valid");
    }

    if (phoneNumber.length !== 10) {
      throw new Error("Phone number length should be 10");
    }
  } catch (error) {
    throw error;
  }
}

module.exports = validatePhoneNumber;
