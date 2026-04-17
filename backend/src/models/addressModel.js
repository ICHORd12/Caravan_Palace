const pool = require("../config/db");
const { mapAddress } = require("../utils/mappers");

exports.createAddress = async (
  { userId, label, fullAddress, isDefault = false },
  dbClient
) => {
  const queryRunner = dbClient || pool;

  const result = await queryRunner.query(
    `INSERT INTO addresses (user_id, label, full_address, is_default)
     VALUES ($1, $2, $3, $4)
     RETURNING address_id, user_id, label, full_address, is_default, created_at, updated_at`,
    [userId, label, fullAddress, isDefault]
  );

  return mapAddress(result.rows[0]);
};
