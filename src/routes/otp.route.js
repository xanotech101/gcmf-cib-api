const express = require("express");
const { generateOTP, generateOtpForBatchUpload } = require("../controller/sms/otp.controller");
const { allUsersAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/generate", allUsersAuth, generateOTP);
router.post("/generateBatchOtp", allUsersAuth, generateOtpForBatchUpload);
router.post("/regenerate", allUsersAuth, generateOTP);


module.exports = router;
