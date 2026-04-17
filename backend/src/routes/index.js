const express = require("express");
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const productRoutes = require("./productRoutes");
const cartRoutes = require("./cartRoutes");
const addressRoutes = require("./addressRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/users/me/addresses", addressRoutes);
router.use("/products", productRoutes);
router.use("/cart", cartRoutes);

module.exports = router;