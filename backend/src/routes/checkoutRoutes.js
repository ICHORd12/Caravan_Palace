const express = require("express");

const checkoutController = require("../controllers/checkoutController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/validate", authMiddleware, checkoutController.validateCheckout);

module.exports = router;