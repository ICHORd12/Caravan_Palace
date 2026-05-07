const sanitizeBody = (body) => {
  if (!body || typeof body !== "object") return body;

  const cloned = { ...body };

  if (cloned.password) cloned.password = "***hidden***";
  if (cloned.token) cloned.token = "***hidden***";

  return cloned;
};

const sanitizeHeaders = (headers) => {
  const cloned = { ...headers };

  if (cloned.authorization) {
    cloned.authorization = "***hidden***";
  }

  return cloned;
};

const debugLogger = (req, res, next) => {
  if (process.env.DEBUG_MODE !== "true") {
    return next();
  }

  const start = Date.now();

  console.log("\n========== INCOMING REQUEST ==========");
  console.log("Time:", new Date().toISOString());
  console.log("Method:", req.method);
  console.log("URL:", req.originalUrl);
  console.log("Params:", req.params);
  console.log("Query:", req.query);
  console.log("Body:", sanitizeBody(req.body));
  console.log("Headers:", sanitizeHeaders(req.headers));

  const originalJson = res.json;
  const originalSend = res.send;

  res.json = function (body) {
    console.log("---------- OUTGOING RESPONSE ----------");
    console.log("Status:", res.statusCode);
    console.log("Response Body:", body);
    console.log("Duration:", `${Date.now() - start} ms`);
    return originalJson.call(this, body);
  };

//   res.send = function (body) {
//     console.log("---------- OUTGOING RESPONSE ----------");
//     console.log("Status:", res.statusCode);
//     console.log("Response Body:", body);
//     console.log("Duration:", `${Date.now() - start} ms`);
//     return originalSend.call(this, body);
//   };

  next();
};

module.exports = debugLogger;