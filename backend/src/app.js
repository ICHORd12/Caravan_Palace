const express = require("express");
const cors = require("cors");//ADD TRİAL
const routes = require("./routes");
const notFoundMiddleware = require("./middlewares/notFoundMiddleware");
const errorMiddleware = require("./middlewares/errorMiddleware");

const app = express(); // ADD TRİAL

app.use(cors());//ADD TRİAL
app.use(express.json());
app.use("/api/v1", routes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;