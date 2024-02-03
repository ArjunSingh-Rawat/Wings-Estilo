const Address = require("../models/addressModel");
const User = require("../models/userModel");

async function addNewAddress(req, res) {
  try {
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

    const address = await Address.create({
      name,
      phoneNumber,
      pinCode,
      addressLine1,
      addressLine2,
      district,
      state,
    });

    if (!address) {
      throw new Error("Error in adding new address");
    }

    await User.findOneAndUpdate(
      { _id: userId },
      {
        $addToSet: {
          addresses: address._id,
        },
      },
      { new: true }
    );
    res.status(200).json({
      success: true,
      message: "successfully added new address",
      address,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function updateAddress(req, res) {
  try {
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
      throw new Error("Address Id not found!");
    }

    res.status(200).json({
      success: true,
      message: "successfully updated!",
      address: updatedAddress,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function deleteOneAddress(req, res) {
  try {
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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function getAllAddresses(req, res) {
  try {
    const userId = req.user.userid;

    const user = await User.findOne({ _id: userId })
      .populate("addresses")
      .select("addresses");

    if (!user) {
      throw new Error("user not found!");
    }

    res.status(200).json({
      success: true,
      message: "success!",
      addresses: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

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
        throw new Error("Pincode is wrong");
      }

      const cityTowns = cityTownData[0].PostOffice;

      if (district) {
        if (
          !cityTowns.find(
            (obj) => obj.District.toLowerCase() === district.toLowerCase()
          )
        ) {
          throw new Error("District provided is wrong!");
        }
      }
      if (state) {
        if (
          !cityTowns.find(
            (obj) => obj.State.toLowerCase() === state.toLowerCase()
          )
        ) {
          throw new Error("State provided is wrong!");
        }
      }
    }
    return { district, state };
  } catch (error) {
    throw error;
  }
}
module.exports = {
  addNewAddress,
  deleteOneAddress,
  updateAddress,
  getAllAddresses,
};
