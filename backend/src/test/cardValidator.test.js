const { describe, test, expect } = require("@jest/globals");
const { validateCard } = require("../utils/cardValidator");

const validCard = {
  cardNumber: "4242 4242 4242 4242",
  cardHolderName: "  Ada Lovelace  ",
  expiryMonth: 12,
  expiryYear: 2100,
  cvv: "123",
};

describe("card validation", () => {
  test("normalizes a valid card payload", () => {
    expect(validateCard(validCard)).toEqual({
      cardNumber: "4242424242424242",
      cardHolderName: "Ada Lovelace",
      expiryMonth: 12,
      expiryYear: 2100,
      cvv: "123",
    });
  });

  test("rejects a card number that fails the Luhn check", () => {
    expect(() =>
      validateCard({
        ...validCard,
        cardNumber: "4242 4242 4242 4241",
      })
    ).toThrow("Card number is invalid");
  });

  test("rejects invalid expiry months", () => {
    expect(() =>
      validateCard({
        ...validCard,
        expiryMonth: 13,
      })
    ).toThrow("Expiry month is invalid");
  });

  test("accepts four-digit security codes", () => {
    expect(validateCard({ ...validCard, cvv: "1234" }).cvv).toBe("1234");
  });
});
