const express = require("express");
const invoiceController = require("../controllers/invoiceController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/:orderId/pdf", authMiddleware, invoiceController.downloadInvoice);

router.post("/:orderId/email", authMiddleware, invoiceController.emailInvoice);

module.exports = router;
