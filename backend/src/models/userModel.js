const pool = require("../config/db");
const { mapUser } = require("../utils/mappers");

exports.findByEmail = async (email) => {
  const result = await pool.query(
    `SELECT user_id, name, email, password, role
     FROM users
     WHERE email = $1`,
    [email]
  );

  const row = result.rows[0];
  if (!row) return null

  const user = mapUser(row);
  return {
    ...user,
    password: row.password,
  };
};

exports.findById = async (id) => {
  const result = await pool.query(
    `SELECT user_id, name, email, tax_id, role, created_at
     FROM users
     WHERE user_id = $1`,
    [id]
  );
  return mapUser(result.rows[0]);
};

exports.updateUser = async (userId, { name, tax_id, passwordHash }) => {
  const fields = [];
  const values = [];
  let idx = 1;

  if (name !== undefined) {
    fields.push(`name = $${idx++}`);
    values.push(name);
  }
  if (tax_id !== undefined) {
    fields.push(`tax_id = $${idx++}`);
    values.push(tax_id);
  }
  if (passwordHash !== undefined) {
    fields.push(`password = $${idx++}`);
    values.push(passwordHash);
  }

  if (fields.length === 0) return null;

  values.push(userId);
  const query = `
    UPDATE users 
    SET ${fields.join(", ")}
    WHERE user_id = $${idx}
    RETURNING user_id, name, email, tax_id, role
  `;

  const result = await pool.query(query, values);
  return mapUser(result.rows[0]);
};

exports.createUser = async ({
  name,
  email,
  passwordHash,
  tax_id,
  home_address,
  role,
}, dbClient) => {
  const queryRunner = dbClient || pool;

  const result = await queryRunner.query(
    `INSERT INTO users 
     (name, email, password, tax_id, home_address, role)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING user_id, name, email, role`,
    [name, email, passwordHash, tax_id, home_address, role]
  );
  return mapUser(result.rows[0]);
};