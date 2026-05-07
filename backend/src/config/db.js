const { Pool } = require("pg");
const env = require("./env");

const pool = new Pool({
  // user: env.DB_USER,
  // password: env.DB_PASSWORD,
  // database: env.DB_NAME,
  // host: env.DB_HOST,
  // port: env.DB_PORT,
  connectionString: env.DB_URL
});

module.exports = pool;