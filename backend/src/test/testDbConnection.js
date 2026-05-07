const pool = require("../config/db");

async function testDatabaseConnection() {
  try {
    const result = await pool.query("SELECT NOW() AS current_time");
    console.log("Database connection successful.");
    console.log("Server time:", result.rows[0].current_time);
  } catch (error) {
    console.error("Database connection failed.");
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

testDatabaseConnection();
