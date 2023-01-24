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
const { MongoClient, ServerApiVersion } = require("mongodb");

process.env.MONGO_URI;



const client = new MongoClient(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
client.connect((err) => {
  const collection = client.db("test").collection("devices");
  // perform actions on the collection object
  client.close();
});

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