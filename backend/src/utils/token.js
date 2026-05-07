const jwt = require("jsonwebtoken");
const env = require("../config/env");

exports.generateToken = (payload) => {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "1h" });
};