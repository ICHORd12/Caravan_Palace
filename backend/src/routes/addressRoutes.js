const express = require("express");
const addressController = require("../controllers/addressController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, addressController.getAddresses);
router.post("/", authMiddleware, addressController.createAddress);
router.patch("/:addressId", authMiddleware, addressController.updateAddress);
router.delete("/:addressId", authMiddleware, addressController.deleteAddress);

module.exports = router;
