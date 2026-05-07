const express = require("express");
const refundController = require("../controllers/refundController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, refundController.listRefunds);
router.patch("/:refundId", authMiddleware, refundController.updateRefundStatus);

module.exports = router;
