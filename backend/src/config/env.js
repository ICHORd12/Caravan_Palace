require("dotenv").config();

module.exports = {
  // PORT: process.env.PORT || 3000,
  // DB_USER: process.env.DB_USER,
  // DB_PASSWORD: process.env.DB_PASSWORD,
  // DB_NAME: process.env.DB_NAME,
  // DB_HOST: process.env.DB_HOST || "localhost",
  // DB_PORT: Number(process.env.DB_PORT) || 5432,
  // JWT_SECRET: process.env.JWT_SECRET,
  PORT: process.env.PORT || 3000,
  DB_URL: process.env.DB_URL,
  JWT_SECRET: process.env.JWT_SECRET,
};