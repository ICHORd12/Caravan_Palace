const pool = require("../config/db");
const { mapWishlistItem } = require("../utils/mappers");

exports.getWishlistByUserId = async (userId) => {
    const result = await pool.query(
        `
        SELECT 
            w.wishlist_id,
            w.product_id,
            w.added_at,

            p.name,
            p.model,
            p.current_price,
            p.base_price,
            p.discount_rate,
            p.quantity_in_stocks,

            pi.url AS image_url

        FROM wishlists w
        INNER JOIN products p 
            ON w.product_id = p.product_id

        LEFT JOIN LATERAL (
            SELECT url
            FROM product_images
            WHERE product_id = p.product_id
            ORDER BY is_primary DESC, created_at ASC
            LIMIT 1
        ) pi ON true

        WHERE w.user_id = $1
        ORDER BY w.added_at DESC
        `,
        [userId]
    );

    return result.rows.map(mapWishlistItem);
};


exports.findWishlistItem = async (userId, productId) => {
    const result = await pool.query(
        `
        SELECT *
        FROM wishlists
        WHERE user_id = $1 AND product_id = $2
        `,
        [userId, productId]
    );

    return mapWishlistItem(result.rows[0]);
};

exports.addToWishlist = async (userId, productId) => {
    const result = await pool.query(
        `
        INSERT INTO wishlists (user_id, product_id)
        VALUES ($1, $2)
        RETURNING *
        `,
        [userId, productId]
    );

    return mapWishlistItem(result.rows[0]);
};

exports.removeFromWishlist = async (userId, productId) => {
    const result = await pool.query(
        `
        DELETE FROM wishlists
        WHERE user_id = $1 AND product_id = $2
        RETURNING *
        `,
        [userId, productId]
    );

    return mapWishlistItem(result.rows[0]);
};