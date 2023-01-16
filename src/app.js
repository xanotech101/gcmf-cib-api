const express = require("express");
const app = express();
const createError = require("http-errors");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const userRoute = require("./routes/user");



mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true })
const db = mongoose.connection
db.on('error', (error) => console.error(error))
db.once('open', () => console.log('Connected to Database'))



app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/users", userRoute);



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
  console.log(`Listeing on port ${3000}...`);
});


module.exports = app;









