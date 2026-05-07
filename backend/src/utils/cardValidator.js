const ApiError = require("./ApiError");

function isDigitsOnly(value) {
  return /^\d+$/.test(value);
}

function validateCardNumber(cardNumber) {
  if (!cardNumber) {
    throw new ApiError(400, "Card number is required");
  }

  const normalized = String(cardNumber).replace(/\s|-/g, "");

  if (!isDigitsOnly(normalized)) {
    throw new ApiError(400, "Card number must contain only digits");
  }

  if (normalized.length < 13 || normalized.length > 19) {
    throw new ApiError(400, "Card number length is invalid");
  }

  if (!passesLuhn(normalized)) {
    throw new ApiError(400, "Card number is invalid");
  }

  return normalized;
}

function passesLuhn(cardNumber) {
  let sum = 0;
  let shouldDouble = false;

  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = Number(cardNumber[i]);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

function validateCardHolderName(cardHolderName) {
  if (!cardHolderName || !String(cardHolderName).trim()) {
    throw new ApiError(400, "Card holder name is required");
  }

  return String(cardHolderName).trim();
}

function validateExpiryMonth(expiryMonth) {
  if (expiryMonth === undefined || expiryMonth === null) {
    throw new ApiError(400, "Expiry month is required");
  }

  const month = Number(expiryMonth);

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new ApiError(400, "Expiry month is invalid");
  }

  return month;
}

function validateExpiryYear(expiryYear) {
  if (expiryYear === undefined || expiryYear === null) {
    throw new ApiError(400, "Expiry year is required");
  }

  const year = Number(expiryYear);

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new ApiError(400, "Expiry year is invalid");
  }

  return year;
}

function validateCardExpiry(expiryMonth, expiryYear) {
  const month = validateExpiryMonth(expiryMonth);
  const year = validateExpiryYear(expiryYear);

  const now = new Date();

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    throw new ApiError(400, "Card is expired");
  }

  return { expiryMonth: month, expiryYear: year };
}

function validateCVV(cvv) {
  if (!cvv) {
    throw new ApiError(400, "CVV is required");
  }

  const normalized = String(cvv).trim();

  if (!/^\d{3,4}$/.test(normalized)) {
    throw new ApiError(400, "CVV is invalid");
  }

  return normalized;
}

exports.validateCard = (payload) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new ApiError(400, "Card payload must be a valid object");
  }

  const cardNumber = validateCardNumber(payload.cardNumber);
  const cardHolderName = validateCardHolderName(payload.cardHolderName);
  const { expiryMonth, expiryYear } = validateCardExpiry(
    payload.expiryMonth,
    payload.expiryYear
  );
  const cvv = validateCVV(payload.cvv);

  return {
    cardNumber,
    cardHolderName,
    expiryMonth,
    expiryYear,
    cvv,
  };
}