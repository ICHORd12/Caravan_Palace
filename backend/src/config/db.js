const env = require("./env");

let pool;

if (env.USE_MOCK_DB) {
  console.log("[DB] Using in-memory mock database");
  pool = require("./mockDb");
} else {
  const { Pool } = require("pg");
  pool = new Pool({
    connectionString: env.DB_URL,
  });
  console.log("[DB] Using PostgreSQL database");
}

module.exports = pool;