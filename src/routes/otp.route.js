const express = require("express");
const generateOTP = require("../controller/sms/otp.controller");
const {
  authoriserAuth,
} = require("../middleware/auth");

const router = express.Router();

router.get("/otp", authoriserAuth, generateOTP);

module.exports = router;
    