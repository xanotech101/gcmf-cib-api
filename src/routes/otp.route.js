const express = require("express");
const generateOTP = require("../controller/sms/otp.controller");
const {
  authoriserAuth, allUsersAuth,
} = require("../middleware/auth");

const router = express.Router();

router.get("/otp", allUsersAuth, generateOTP);

module.exports = router;
