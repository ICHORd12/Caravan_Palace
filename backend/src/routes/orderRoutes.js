const express = require("express");
const orderController = require("../controllers/orderController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, orderController.getOrders);
router.get("/:orderId", authMiddleware, orderController.getOrderDetails);

module.exports = router;