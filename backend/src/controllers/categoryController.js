const categoryService = require("../services/categoryService");

exports.getAllCategories = async (req, res, next) => {
  try {
    const result = await categoryService.getAllCategories();
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

exports.updateCategoryActivation = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const userRole = req.user.role;
    const isActive = req.body.isActive ?? req.body.is_active;

    const result = await categoryService.updateCategoryActivation({
      categoryId,
      isActive,
      userRole,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
