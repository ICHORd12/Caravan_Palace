const express = require("express");
const userController = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");
const addressRoutes = require("./addressRoutes");
const orderRoutes = require("./orderRoutes");

const router = express.Router();

router.get("/me", authMiddleware, userController.me);
router.patch("/me", authMiddleware, userController.update);
router.use("/me/addresses", addressRoutes);
router.use("/me/orders", orderRoutes);

module.exports = router;