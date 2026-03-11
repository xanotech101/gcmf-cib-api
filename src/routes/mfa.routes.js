const express = require('express');
const router = express.Router();
const { allUsersAuth } = require('../middleware/auth');
const {
  setupMFA,
  verifyMFASetup,
  verifyMFALogin
} = require('../controller/mfa');

router.post('/setup', allUsersAuth, setupMFA);
router.post('/verify-setup', allUsersAuth, verifyMFASetup);
router.post('/verify', verifyMFALogin);

module.exports = router;