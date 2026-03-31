require("dotenv").config();

module.exports = {
  PORT: process.env.PORT || 3000,
  DB_URL: process.env.DB_URL,
  JWT_SECRET: process.env.JWT_SECRET || "caravan_palace_dev_secret_2026",
  USE_MOCK_DB: !process.env.DB_URL || process.env.USE_MOCK_DB === "true",
};