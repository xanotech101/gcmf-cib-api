const express = require("express");
const bodyparser = require("body-parser");
require("dotenv").config();
const app = express();
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const path = require("path");

const userRoute = require("./routes/user.route");
const ticket = require("./routes/ticket.routes");
const tokenRoute = require("./routes/csrfToken");
const accountRoute = require("./routes/account");
const mandateRoute = require("./routes/mandate.route");
const requestRoute = require("./routes/initiateRequest");
const paystackRoute = require("./routes/paystack.route");
const trailRoute = require("./routes/auditTrail");
const authRoute = require("./routes/auth.route");
const notificationRoute = require("./routes/notification.route");
const otpRoute = require("./routes/otp.route");
const privilegeRoute = require("./routes/privilege.route");
const secretQuestionRoute = require("./routes/secretQuestion.route");
const bankoneRoute = require("./routes/bankone.route");
const settingsRoute = require("./routes/settings.route")
const organizationRoute = require('./routes/organization')
// const externalRoute = require('./routes/external.route')
const organizationLabelRoutes = require('./routes/organizationLabelAdmin')
const eazyPayRoutes = require('./routes/eazy-pay.routes')


const cors = require("cors");
const connectDB = require("./config/db");
const { sendSMS } = require("./services/sms.service");
const { consumeQueue } = require("./services/messageQueue/queueing_system");

let URI = process.env.MONGO_URI;

// if (process.env.NODE_ENV == "development") {
//   URI = "mongodb://localhost/xanotech";
// }

connectDB(URI, () => {
  app.listen(process.env.PORT, () => {
    console.log(
      "listening for requests on port",
      process.env.PORT,
      process.env.NODE_ENV
    );
  });
});

app.use(
  cors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
  })
);

// ConnectMQ().then(() =>{
//   ConsumeFromQueue()
// }).catch((error) =>{
//   console.log(error)
// })

consumeQueue().catch((error) => {
  console.error(error);
});

app.use('/static', express.static(path.join(__dirname, 'public')))


app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());


app.get("/health", (req, res) => {
  res.send("Welcome to GMFB Banking API");
});

app.use("/api/token", tokenRoute);
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/account", accountRoute);
app.use("/api/mandate", mandateRoute);
app.use("/api", paystackRoute);
app.use("/api/audit_trails", trailRoute);
app.use("/api/requests", requestRoute);
app.use("/api/notifications", notificationRoute);
app.use("/api/otp", otpRoute);
app.use("/api/privileges", privilegeRoute);
app.use("/api/secret_questions", secretQuestionRoute);
app.use("/api/ticket", ticket);
app.use("/api/bank", bankoneRoute);
app.use("/api/settings", settingsRoute);
app.use("/api/organization", organizationRoute);
// app.use('/api/thirdparty',externalRoute)
app.use('/api/organizationLabel', organizationLabelRoutes)
app.use('/api/eazyPay', eazyPayRoutes)

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});


app.use((req, res, next) => {
  if (res.headersSent) {
    return next();
  }
  res
    .status(404)
    .json({
      message:
        "404 error! The endpoint is not available on the server. Kindly cross check the url",
    });
});


module.exports = app;





