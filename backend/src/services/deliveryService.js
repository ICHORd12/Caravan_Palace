const ApiError = require("../utils/ApiError");
const deliveryModel = require("../models/deliveryModel");

const assertDeliveryManager = (userRole) => {
  if (userRole !== "sales_manager" && userRole !== "product_manager") {
    throw new ApiError(
      403,
      "Only sales managers or product managers can view deliveries"
    );
  }
};

exports.getAllDeliveriesForManager = async ({ userRole }) => {
  assertDeliveryManager(userRole);

  const deliveries = await deliveryModel.listDeliveriesForManager();

  return {
    message: "Deliveries fetched successfully",
    deliveries,
  };
};
