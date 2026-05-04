const express = require("express");
const orderController = require("../controllers/orderController");
const refundController = require("../controllers/refundController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, orderController.getOrders);
router.get("/:orderId", authMiddleware, orderController.getOrderDetails);
router.post("/:orderId/cancel", authMiddleware, orderController.cancelOrder);
router.post(
	"/:orderId/refund-requests",
	authMiddleware,
	refundController.requestRefundForOrder
);

module.exports = router;