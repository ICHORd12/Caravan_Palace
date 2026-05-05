const express = require("express");
const orderManagementController = require("../controllers/orderManagementController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.patch("/:orderId/status", authMiddleware, orderManagementController.updateOrderStatus);

module.exports = router;
