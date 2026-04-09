const normalizeSort = (sort) => {
    if (!sort) {
        return undefined;
    }
    const validSorts = ["price_asc", "price_desc"];
    if (!validSorts.includes(sort)) {
        throw new ApiError(400, "Invalid sort parameter. Valid values are: " + validSorts.join(", "));
    }
    return sort;
}

const getOrderByClause = (sort) => {
  switch (sort) {
    case "price_asc":
      return "ORDER BY current_price ASC NULLS LAST";
    case "price_desc":
      return "ORDER BY current_price DESC NULLS LAST";
    default:
      return "ORDER BY created_at DESC";
  }
};

