const express = require("express");
const userController = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");
const addressRoutes = require("./addressRoutes");

const router = express.Router();

router.get("/me", authMiddleware, userController.me);
router.use("/me/addresses", addressRoutes);

module.exports = router;