const userService = require("../services/userService");

exports.me = async (req, res, next) => {
  try {
    const user = await userService.getMe(req.user.userId);
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const result = await userService.updateMe(req.user.userId, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};