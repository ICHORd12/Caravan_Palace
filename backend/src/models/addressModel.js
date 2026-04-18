const pool = require("../config/db");
const { mapAddress } = require("../utils/mappers");

const ADDRESS_RETURNING_COLUMNS =
  "address_id, user_id, label, full_address, is_default, created_at, updated_at";

exports.createAddress = async (
  { userId, label, fullAddress, isDefault = false },
  dbClient
) => {
  const queryRunner = dbClient || pool;

  const result = await queryRunner.query(
    `INSERT INTO addresses (user_id, label, full_address, is_default)
     VALUES ($1, $2, $3, $4)
     RETURNING ${ADDRESS_RETURNING_COLUMNS}`,
    [userId, label, fullAddress, isDefault]
  );

  return mapAddress(result.rows[0]);
};

exports.getAddressesByUserId = async (userId, dbClient) => {
  const queryRunner = dbClient || pool;

  const result = await queryRunner.query(
    `SELECT ${ADDRESS_RETURNING_COLUMNS}
     FROM addresses
     WHERE user_id = $1
     ORDER BY is_default DESC, created_at DESC`,
    [userId]
  );

  return result.rows.map(mapAddress);
};

exports.getAddressByUserIdAndAddressId = async (userId, addressId, dbClient) => {
  const queryRunner = dbClient || pool;

  const result = await queryRunner.query(
    `SELECT ${ADDRESS_RETURNING_COLUMNS}
     FROM addresses
     WHERE user_id = $1 AND address_id = $2`,
    [userId, addressId]
  );

  return mapAddress(result.rows[0]);
};

exports.getAddressCountByUserId = async (userId, dbClient) => {
  const queryRunner = dbClient || pool;

  const result = await queryRunner.query(
    `SELECT COUNT(*)::int AS count
     FROM addresses
     WHERE user_id = $1`,
    [userId]
  );

  return result.rows[0].count;
};

exports.clearDefaultAddressByUserId = async (userId, dbClient) => {
  const queryRunner = dbClient || pool;

  await queryRunner.query(
    `UPDATE addresses
     SET is_default = false,
         updated_at = NOW()
     WHERE user_id = $1 AND is_default = true`,
    [userId]
  );
};

exports.setDefaultAddressById = async (userId, addressId, dbClient) => {
  const queryRunner = dbClient || pool;

  const result = await queryRunner.query(
    `UPDATE addresses
     SET is_default = true,
         updated_at = NOW()
     WHERE user_id = $1 AND address_id = $2
     RETURNING ${ADDRESS_RETURNING_COLUMNS}`,
    [userId, addressId]
  );

  return mapAddress(result.rows[0]);
};

exports.getMostRecentAddressByUserId = async (userId, dbClient) => {
  const queryRunner = dbClient || pool;

  const result = await queryRunner.query(
    `SELECT ${ADDRESS_RETURNING_COLUMNS}
     FROM addresses
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );

  return mapAddress(result.rows[0]);
};

exports.updateAddressByUserIdAndAddressId = async (
  userId,
  addressId,
  { label, fullAddress, isDefault },
  dbClient
) => {
  const queryRunner = dbClient || pool;
  const setClauses = [];
  const values = [userId, addressId];
  let paramIndex = 3;

  if (label !== undefined) {
    setClauses.push(`label = $${paramIndex}`);
    values.push(label);
    paramIndex += 1;
  }

  if (fullAddress !== undefined) {
    setClauses.push(`full_address = $${paramIndex}`);
    values.push(fullAddress);
    paramIndex += 1;
  }

  if (isDefault !== undefined) {
    setClauses.push(`is_default = $${paramIndex}`);
    values.push(isDefault);
    paramIndex += 1;
  }

  setClauses.push("updated_at = NOW()");

  const result = await queryRunner.query(
    `UPDATE addresses
     SET ${setClauses.join(", ")}
     WHERE user_id = $1 AND address_id = $2
     RETURNING ${ADDRESS_RETURNING_COLUMNS}`,
    values
  );

  return mapAddress(result.rows[0]);
};

exports.deleteAddressByUserIdAndAddressId = async (userId, addressId, dbClient) => {
  const queryRunner = dbClient || pool;

  const result = await queryRunner.query(
    `DELETE FROM addresses
     WHERE user_id = $1 AND address_id = $2
     RETURNING ${ADDRESS_RETURNING_COLUMNS}`,
    [userId, addressId]
  );

  return mapAddress(result.rows[0]);
};
