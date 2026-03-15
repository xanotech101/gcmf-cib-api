const express = require('express');
const router = express.Router();
const { allUsersAuth } = require('../middleware/auth');
const {
  setupMFA,
  verifyMFASetup,
  verifyMFALogin,
  disableMFA
} = require('../controller/mfa');
const { sendEmergencyEmail, verifyEmailAndSendOTP, verifyPhoneAndLogin } = require('../controller/emergencyMFA.controller');

router.post('/setup', allUsersAuth, setupMFA);
router.post('/verify-setup', allUsersAuth, verifyMFASetup);
router.post('/verify', verifyMFALogin);
router.post('/send-email', sendEmergencyEmail);
router.post('/verify-email', verifyEmailAndSendOTP);
router.post('/verify-phone', verifyPhoneAndLogin);

router.post('/disable', allUsersAuth, disableMFA);

module.exports = router;