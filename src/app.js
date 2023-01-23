const express = require("express");
const bodyparser = require("body-parser");
const dotenv = require("dotenv").config();
const app = express();
const createError = require("http-errors");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const userRoute = require("./routes/user");
const accountRoute = require("./routes/account");
const mandateRoute = require("./routes/mandate");
const mongoose = require("mongoose");

mongoose
  .set("strictQuery", false)
  .connect("mongodb://localhost/xanotech", { useNewUrlParser: true })
  .then(console.log("Connected to MongoDB..."))
  .catch((err) => console.error("Could not connect to MongoDB...", err));

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());

app.use("/users", userRoute);
app.use("/account", accountRoute);
app.use("/mandate", mandateRoute);

app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Listeing on port ${port}...`);
});

module.exports = app;