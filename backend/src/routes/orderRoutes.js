const express = require("express");
const orderController = require("../controllers/orderController");
const refundController = require("../controllers/refundController");
const invoiceController = require("../controllers/invoiceController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, orderController.getOrders);
router.get("/:orderId/invoice.pdf", authMiddleware, invoiceController.downloadInvoice);
router.get("/:orderId/invoice", authMiddleware, invoiceController.downloadInvoice);
router.get("/:orderId", authMiddleware, orderController.getOrderDetails);
router.post("/:orderId/cancel", authMiddleware, orderController.cancelOrder);
router.post(
	"/:orderId/refund-requests",
	authMiddleware,
	refundController.requestRefundForOrder
);
router.post(
	"/:orderId/items/:orderItemId/refund-requests",
	authMiddleware,
	refundController.requestRefundForOrderItem
);

module.exports = router;
