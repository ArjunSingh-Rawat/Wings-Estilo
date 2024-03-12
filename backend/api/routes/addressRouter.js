const express = require("express");
const {
  addNewAddress,
  deleteOneAddress,
  updateAddress,
  getAllAddresses,
  setDefaultAddress,
} = require("../controllers/addressController");
const router = express.Router();

router.post("/add-new", addNewAddress);

router.put("/:addressId", updateAddress);

router.delete("/:addressId", deleteOneAddress);

router.get("/", getAllAddresses);

router.put("/set-default/:addressId", setDefaultAddress);

module.exports = router;
