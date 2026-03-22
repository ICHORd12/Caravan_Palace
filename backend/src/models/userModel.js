const pool = require("../config/db");

exports.findByEmail = async (email) => {
  const result = await pool.query(
    `SELECT user_id, name, email, password, role
     FROM users
     WHERE email = $1`,
    [email]
  );
  return result.rows[0];
};

exports.findById = async (id) => {
  const result = await pool.query(
    `SELECT user_id, name, email, role
     FROM users
     WHERE user_id = $1`,
    [id]
  );
  return result.rows[0];
};

exports.createUser = async ({
  name,
  email,
  passwordHash,
  taxId,
  homeAddress,
  role,
}) => {
  const result = await pool.query(
    `INSERT INTO users 
     (name, email, password, tax_id, home_address, role)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING user_id, name, email, role`,
    [name, email, passwordHash, taxId, homeAddress, role]
  );
  return result.rows[0];
};