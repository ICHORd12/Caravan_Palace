const userModel = require("../models/userModel");
const { hashPassword, comparePassword } = require("../utils/hash");
const { generateToken } = require("../utils/token");
const ApiError = require("../utils/ApiError");

exports.register = async ({
  name,
  email,
  password,
  tax_id,
  home_address,
  role = "customer",
}) => {
  const existingUser = await userModel.findByEmail(email);

  if (existingUser) {
    throw new ApiError(400, "Email already exists");
  }

  const passwordHash = await hashPassword(password);

  const user = await userModel.createUser({
    name,
    email,
    passwordHash,
    tax_id,
    home_address,
    role,
  });

  return {
    message: "User created successfully",
    user: {
      id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};

exports.login = async ({ email, password }) => {
  const user = await userModel.findByEmail(email);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isValid = await comparePassword(password, user.password);

  if (!isValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const token = generateToken({
    userId: user.user_id,
    email: user.email,
    role: user.role,
  });

  return {
    message: "Login successful",
    token,
    user: {
      id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};