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
const superUserRoute = require("./routes/superUser");
const utilsRoute = require("./routes/utils");
const mongoose = require("mongoose");

// mongoose
//   .set("strictQuery", false)
//   .connect(
//     "mongodb+srv://xanotech:<gcmb123>@cluster0.idde9t1.mongodb.net/?retryWrites=true&w=majority",
//     { useNewUrlParser: true }
//   )
//   .then(console.log("Connected to MongoDB..."))
//   .catch((err) => console.error("Could not connect to MongoDB...", err));

// connect to db


console.log("haha");
if (process.env.NODE_ENV == 'production') {
  
  URI = "mongodb://localhost/xanotech";
} else  {

    URI = process.env.MONGO_URI;
}



mongoose
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

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());

app.use("/api/users", userRoute);
app.use("/api/account", accountRoute);
app.use("/api/mandate", mandateRoute);
app.use("/api/admin", superUserRoute);
// app.use("/", utilsRoute);

app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

// const port = process.env.PORT || 3000;

// app.listen(port, () => {
//   console.log(`Listeing on port ${port}...`);
// });

module.exports = app;