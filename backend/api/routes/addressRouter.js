const express = require("express");
const {
  addNewAddress,
  deleteOneAddress,
  updateAddress,
  getAllAddresses,
} = require("../controllers/addressController");
const router = express.Router();

router.post("/add-new", addNewAddress);

router.put("/:addressId", updateAddress);

router.delete("/:addressId", deleteOneAddress);

router.get("/", getAllAddresses);

module.exports = router;
