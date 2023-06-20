const express = require("express");
const { 
  generateOTP, 
  generateOtpForBatchUpload, 
  disableUserOtp,
  enableUserOtp,
  Update_emailOTP
} = require("../controller/sms/otp.controller");
const { allUsersAuth, superUserAuth } = require("../middleware/auth");
const { disableAccount, enableAccount } = require("../controller/account");

const router = express.Router();

router.post("/generate", allUsersAuth, generateOTP);
router.post("/generateBatchOtp", allUsersAuth, generateOtpForBatchUpload);
router.post("/regenerate", allUsersAuth, generateOTP);
router.post('/disableUserOtp', allUsersAuth, disableUserOtp)
router.post('/enableUserOtp', allUsersAuth, enableUserOtp)
router.post('/disableAccountOtp', allUsersAuth, disableAccount)
router.post('/enableAccountOtp', allUsersAuth, enableAccount)
router.post('/updateEmailotp', superUserAuth, Update_emailOTP)


module.exports = router;
