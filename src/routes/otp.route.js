const express = require("express");
const { 
  generateOTP, 
  generateOtpForBatchUpload, 
  disableUserOtp,
  enableUserOtp
} = require("../controller/sms/otp.controller");
const { allUsersAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/generate", allUsersAuth, generateOTP);
router.post("/generateBatchOtp", allUsersAuth, generateOtpForBatchUpload);
router.post("/regenerate", allUsersAuth, generateOTP);
router.post('/disableUserOtp', allUsersAuth, disableUserOtp)
router.post('/enableUserOtp', allUsersAuth, enableUserOtp)


module.exports = router;
