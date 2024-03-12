const Address = require("../models/addressModel");
const User = require("../models/userModel");
const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/apiError");

const addNewAddress = asyncHandler(async (req, res) => {
  let {
    name,
    phoneNumber,
    pinCode,
    addressLine1,
    addressLine2,
    district,
    state,
  } = req.body;

  const userId = req.user.userid;

  const data = await checkPinCode(pinCode, district, state);

  district = data.district;
  state = data.state;

  const user = await User.findOne({ _id: userId });

  if (!user) {
    throw new ApiError(404, "User not found!");
  }

  if (user.addresses.length + 1 > 6) {
    throw new ApiError(400, "Cannot add addresses more than 6");
  }
  let defaultAddress = false;
  if (user.addresses.length === 0) {
    defaultAddress = true;
  }
  const address = await Address.create({
    defaultAddress,
    name,
    phoneNumber,
    pinCode,
    addressLine1,
    addressLine2,
    district,
    state,
  });

  if (!address) {
    throw new ApiError(500, "Error in adding new address");
  }

  user.addresses.push(address);
  await user.save();

  res.status(200).json({
    success: true,
    message: "successfully added new address",
    address,
  });
});

const updateAddress = asyncHandler(async (req, res) => {
  const addressFields = Object.keys(Address.schema.obj);

  const fieldsToUpdate = {};
  for (const field in req.body) {
    if (addressFields.includes(field)) {
      fieldsToUpdate[field] = req.body[field];
    }
  }

  const data = await checkPinCode(
    fieldsToUpdate.pinCode,
    fieldsToUpdate.district,
    fieldsToUpdate.state
  );

  fieldsToUpdate.district = data.district;
  fieldsToUpdate.state = data.state;

  const updatedAddress = await Address.findOneAndUpdate(
    { _id: req.params.addressId },
    fieldsToUpdate,
    { new: true }
  );

  if (!updatedAddress) {
    throw new ApiError(500, "Address Id not found!");
  }

  res.status(200).json({
    success: true,
    message: "successfully updated!",
    address: updatedAddress,
  });
});

const deleteOneAddress = asyncHandler(async (req, res) => {
  const userId = req.user.userid;

  const deletedAddress = await Address.findOneAndDelete({
    _id: req.params.addressId,
  });

  const user = await User.findOneAndUpdate(
    { _id: userId },
    {
      $pull: {
        addresses: deletedAddress._id,
      },
    }
  );

  res.status(200).json({
    success: true,
    message: "successfully deleted address!",
  });
});

const getAllAddresses = asyncHandler(async (req, res) => {
  const userId = req.user.userid;

  const user = await User.findOne({ _id: userId })
    .populate("addresses")
    .select("addresses");

  if (!user) {
    throw new ApiError(404, "user not found!");
  }

  res.status(200).json({
    success: true,
    message: "success!",
    addresses: user,
  });
});

async function checkPinCode(pinCode, district, state) {
  try {
    if (pinCode) {
      const cityTownsRequest = await fetch(
        `https://api.postalpincode.in/pincode/${pinCode}`
      );

      const cityTownData = await cityTownsRequest.json();
      if (
        cityTownData[0].Status === "Error" ||
        cityTownData[0].Status === "404"
      ) {
        throw new ApiError(400, "Pincode is wrong");
      }

      const cityTowns = cityTownData[0].PostOffice;

      if (district) {
        if (
          !cityTowns.find(
            (obj) => obj.District.toLowerCase() === district.toLowerCase()
          )
        ) {
          throw new ApiError(400, "District provided is wrong!");
        }
      }
      if (state) {
        if (
          !cityTowns.find(
            (obj) => obj.State.toLowerCase() === state.toLowerCase()
          )
        ) {
          throw new ApiError(400, "State provided is wrong!");
        }
      }
    }
    return { district, state };
  } catch (error) {
    throw error;
  }
}

const setDefaultAddress = asyncHandler(async (req, res) => {
  const addressId = req.params.addressId;
  const prevDefaultAddressId = req.body.prevDefaultAddressId;

  await Address.findOneAndUpdate({ _id: addressId }, { defaultAddress: true });
  await Address.findOneAndUpdate(
    { _id: prevDefaultAddressId },
    { defaultAddress: false }
  );

  res.status(204).end();
});

module.exports = {
  addNewAddress,
  deleteOneAddress,
  updateAddress,
  getAllAddresses,
  setDefaultAddress,
};
