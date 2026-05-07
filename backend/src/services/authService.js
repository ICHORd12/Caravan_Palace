const userModel = require("../models/userModel");
const addressModel = require("../models/addressModel");
const pool = require("../config/db");
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

  const client = await pool.connect();
  let user;

  try {
    await client.query("BEGIN");

    user = await userModel.createUser(
      {
        name,
        email,
        passwordHash,
        tax_id,
        home_address,
        role,
      },
      client
    );

    await addressModel.createAddress(
      {
        userId: user.userId,
        label: "Home",
        fullAddress: home_address,
        isDefault: true,
      },
      client
    );

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  return {
    message: "User created successfully",
    user: {
      id: user.userId,
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
    userId: user.userId,
    role: user.role,
  });

  return {
    message: "Login successful",
    token,
    user: {
      id: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};