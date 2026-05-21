const express = require("express");
const categoryController = require("../controllers/categoryController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", categoryController.getAllCategories);
router.patch("/:categoryId/activation", authMiddleware, categoryController.updateCategoryActivation);

module.exports = router;
