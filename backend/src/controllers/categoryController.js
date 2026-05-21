const categoryService = require("../services/categoryService");

exports.getAllCategories = async (req, res, next) => {
  try {
    const result = await categoryService.getAllCategories(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
