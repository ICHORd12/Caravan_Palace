const express = require("express");
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const productRoutes = require("./productRoutes");
const cartRoutes = require("./cartRoutes");
const paymentRoutes = require("./paymentRoutes");
const checkoutRoutes = require("./checkoutRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/products", productRoutes);
router.use("/cart", cartRoutes);
router.use("/payments", paymentRoutes);
router.use("/checkout", checkoutRoutes);

module.exports = router;