const express = require("express");
const orderManagementController = require("../controllers/orderManagementController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, orderManagementController.getAllOrders);
router.get("/deliveries", authMiddleware, orderManagementController.getAllDeliveries);
router.get("/reports/financial-summary", authMiddleware, orderManagementController.getFinancialSummary);
router.get("/:orderId/invoice.pdf", authMiddleware, orderManagementController.downloadOrderInvoice);
router.patch("/:orderId/status", authMiddleware, orderManagementController.updateOrderStatus);

module.exports = router;
