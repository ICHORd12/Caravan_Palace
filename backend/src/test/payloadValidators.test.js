const { describe, test, expect } = require("@jest/globals");
const {
  hasOwn,
  validateRequiredString,
  validateOptionalBoolean,
  validateObjectPayload,
} = require("../utils/payloadValidators");

describe("payload validator utilities", () => {
  test("validateRequiredString trims valid input", () => {
    expect(validateRequiredString("  Camper Van  ", "name")).toBe(
      "Camper Van"
    );
  });

  test("validateRequiredString rejects whitespace-only input", () => {
    expect(() => validateRequiredString("   ", "name")).toThrow(
      "name cannot be empty"
    );
  });

  test("validateOptionalBoolean preserves boolean values", () => {
    expect(validateOptionalBoolean(false, "isActive")).toBe(false);
    expect(() => validateOptionalBoolean("false", "isActive")).toThrow(
      "isActive must be a boolean"
    );
  });

  test("validateObjectPayload rejects arrays", () => {
    expect(() => validateObjectPayload([])).toThrow(
      "Request body must be a JSON object"
    );
  });

  test("hasOwn ignores properties inherited from the prototype", () => {
    const payload = Object.create({ role: "product_manager" });
    payload.name = "Ada";

    expect(hasOwn(payload, "name")).toBe(true);
    expect(hasOwn(payload, "role")).toBe(false);
  });
});
