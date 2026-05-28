const ApiError = require("./ApiError");

exports.normalizeSort = (sort) => {
    if (!sort) {
        return undefined;
    }
    const validSorts = [
      "price_asc",
      "price_desc",
      "date_asc",
      "date_desc",
      "rating_asc",
      "rating_desc",
    ];
    if (!validSorts.includes(sort)) {
        throw new ApiError(400, "Invalid sort parameter. Valid values are: " + validSorts.join(", "));
    }
    return sort;
}

exports.getOrderByClause = (sort) => {
  switch (sort) {
    case "price_asc":
      return "ORDER BY current_price ASC NULLS LAST";
    case "price_desc":
      return "ORDER BY current_price DESC NULLS LAST";
    case "date_asc":
      return "ORDER BY created_at ASC NULLS LAST";
    case "date_desc":
      return "ORDER BY created_at DESC NULLS LAST";
    case "rating_asc":
      return "ORDER BY pr.average_rating ASC NULLS LAST, created_at DESC NULLS LAST";
    case "rating_desc":
      return "ORDER BY pr.average_rating DESC NULLS LAST, created_at DESC NULLS LAST";
    default:
      return "ORDER BY created_at DESC";
  }
};

