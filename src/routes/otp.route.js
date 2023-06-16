const express = require("express");
const { 
  generateOTP, 
  generateOtpForBatchUpload, 
  disableUserOtp,
  enableUserOtp,
  Update_emailOTP
} = require("../controller/sms/otp.controller");
const { allUsersAuth, superUserAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/generate", allUsersAuth, generateOTP);
router.post("/generateBatchOtp", allUsersAuth, generateOtpForBatchUpload);
router.post("/regenerate", allUsersAuth, generateOTP);
router.post('/disableUserOtp', allUsersAuth, disableUserOtp)
router.post('/enableUserOtp', allUsersAuth, enableUserOtp)
router.post('/updateEmailotp', superUserAuth, Update_emailOTP)


module.exports = router;
