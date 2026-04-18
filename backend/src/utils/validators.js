const ApiError = require("../utils/ApiError");

exports.hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

exports.validateRequiredString = (value, fieldName) => {
  if (typeof value !== "string") {
    throw new ApiError(400, `${fieldName} is required`);
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    throw new ApiError(400, `${fieldName} cannot be empty`);
  }

  return trimmedValue;
};

exports.validateOptionalString = (value, fieldName) => {
  if (typeof value !== "string") {
    throw new ApiError(400, `${fieldName} must be a string`);
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    throw new ApiError(400, `${fieldName} cannot be empty`);
  }

  return trimmedValue;
};

exports.validateOptionalBoolean = (value, fieldName) => {
  if (typeof value !== "boolean") {
    throw new ApiError(400, `${fieldName} must be a boolean`);
  }

  return value;
};

exports.validateObjectPayload = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ApiError(400, "Request body must be a JSON object");
  }

  return value;
};