const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const notFoundMiddleware = require("./middlewares/notFoundMiddleware");
const errorMiddleware = require("./middlewares/errorMiddleware");
const debugLogger = require("./middlewares/debugLoggerMiddleware");

const app = express();

app.use(cors());

app.use(express.json());
app.use(debugLogger)
app.use("/api/v2", routes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;