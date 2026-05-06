const ApiError = require("../utils/ApiError");
const financialReportModel = require("../models/financialReportModel");

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const assertSalesManager = (userRole) => {
  if (userRole !== "sales_manager") {
    throw new ApiError(403, "Only sales managers can view financial reports");
  }
};

const parseDateOnly = (value, fieldName) => {
  if (typeof value !== "string" || !value.trim()) {
    throw new ApiError(400, `${fieldName} is required`);
  }

  const normalizedValue = value.trim();

  if (!DATE_ONLY_PATTERN.test(normalizedValue)) {
    throw new ApiError(400, `${fieldName} must use YYYY-MM-DD format`);
  }

  const [year, month, day] = normalizedValue.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new ApiError(400, `${fieldName} is not a valid calendar date`);
  }

  return { normalizedValue, date };
};

const addUtcDays = (date, days) => {
  const nextDate = new Date(date.getTime());
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
};

exports.getFinancialSummary = async ({ startDate, endDate, userRole }) => {
  assertSalesManager(userRole);

  const parsedStartDate = parseDateOnly(startDate, "startDate");
  const parsedEndDate = parseDateOnly(endDate, "endDate");

  if (parsedStartDate.date.getTime() > parsedEndDate.date.getTime()) {
    throw new ApiError(400, "startDate cannot be after endDate");
  }

  const startAt = parsedStartDate.date.toISOString();
  const endAt = addUtcDays(parsedEndDate.date, 1).toISOString();

  const summary = await financialReportModel.getFinancialSummaryByOrderDateRange({
    startAt,
    endAt,
  });

  return {
    message: "Financial summary fetched successfully",
    dateRange: {
      startDate: parsedStartDate.normalizedValue,
      endDate: parsedEndDate.normalizedValue,
      startAt,
      endAt,
    },
    summary,
  };
};
