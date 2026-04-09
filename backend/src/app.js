const express = require("express");
const routes = require("./routes");
const notFoundMiddleware = require("./middlewares/notFoundMiddleware");
const errorMiddleware = require("./middlewares/errorMiddleware");

const app = express();

app.use(express.json());
app.use("/api/v2", routes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;