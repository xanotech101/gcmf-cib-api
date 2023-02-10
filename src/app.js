const express = require("express");
const bodyparser = require("body-parser");
const dotenv = require("dotenv").config();
const app = express();
const createError = require("http-errors");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const userRoute = require("./routes/user.route");
const accountRoute = require("./routes/account");
const mandateRoute = require("./routes/mandate");
const generalRoute = require("./routes/general");
const paystackRoute = require("./routes/paystack.route");
const authRoute = require("./routes/auth.route");
const mongoose = require("mongoose");
const cors = require("cors");



if (process.env.NODE_ENV == 'development') {
  
  URI = "mongodb://localhost/xanotech";
} else  {

    URI = process.env.MONGO_URI;
}



mongoose
  .set("strictQuery", false)
  .connect(URI)
  .then(() => {
    console.log("connected to database");
    // listen to port
    app.listen(process.env.PORT, () => {
      console.log(
        "listening for requests on port",
        process.env.PORT,
        process.env.NODE_ENV
      );
    });
  })
  .catch((err) => {
    console.log(err);
  }); 

app.use(cors(
  {
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
  }
));
// app.use((req, res, next) => {
//   res.status(404).json({message: "404 error! The endpoint is not available on the server. Kindly cross check the url"})
// });

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());


app.use("/api/auth", authRoute)
app.use("/api/users", userRoute);
app.use("/api/account", accountRoute);
app.use("/api/mandate", mandateRoute);
app.use("/api", paystackRoute);
app.use("/api", generalRoute);

app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

// app.use((req, res, next) => {
//   res.status(404).json({message: "404 error! The endpoint is not available on the server. Kindly cross check the url"})
// });

// const port = process.env.PORT || 3000;

// app.listen(port, () => {
//   console.log(`Listeing on port ${port}...`);
// });

module.exports = app;