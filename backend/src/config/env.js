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

  // SMTP / Email configuration
  SMTP_HOST: process.env.SMTP_HOST || "smtp.gmail.com",
  SMTP_PORT: Number(process.env.SMTP_PORT) || 587,
  SMTP_SECURE: process.env.SMTP_SECURE === "true",
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  MAIL_FROM: process.env.MAIL_FROM || "Caravan Palace <no-reply@caravanpalace.com>",
};