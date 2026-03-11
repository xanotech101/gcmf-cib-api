const User = require('../model/user.model');
const { generateMFASecret, verifyMFAToken, verifyBackupCode } = require('../utils/mfa');
const bcrypt = require('bcryptjs');

const setupMFA = async (req, res) => {
  try {
    const userId = req.user._id;

    console.log(userId)
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        status: 'failed',
        message: 'User not found',
        data: null
      });
    }

    if (user.isMFAEnabled) {
      return res.status(400).json({
        status: 'failed',
        message: 'MFA already enabled',
        data: null
      });
    }

    const { secret, qrCode, backupCodes } = await generateMFASecret(user.email);

    const hashedBackupCodes = backupCodes.map(code =>
      bcrypt.hashSync(code.replace(/-/g, ''), 10)
    );

    user.mfaSecret = secret;
    user.mfaBackupCodes = hashedBackupCodes;
    await user.save();

    res.json({
      status: 'success',
      message: 'MFA setup initiated',
      data: {
        qrCode,
        manualEntryKey: secret,
        backupCodes
      }
    });

  } catch (error) {
    console.error('MFA Setup Error:', error);
    res.status(500).json({
      status: 'failed',
      message: 'Failed to setup MFA',
      data: null
    });
  }
};

const verifyMFASetup = async (req, res) => {
  try {
    const { firstCode, secondCode } = req.body;
    const userId = req.user._id;

    if (!firstCode || !secondCode) {
      return res.status(400).json({
        status: 'failed',
        message: 'Both first and second codes are required',
        data: null
      });
    }

    if (!/^\d{6}$/.test(firstCode) || !/^\d{6}$/.test(secondCode)) {
      return res.status(400).json({
        status: 'failed',
        message: 'Codes must be 6 digits each',
        data: null
      });
    }

    const user = await User.findById(userId);

    if (!user || !user.mfaSecret) {
      return res.status(400).json({
        status: 'failed',
        message: 'MFA setup not initiated',
        data: null
      });
    }

    const isFirstValid = verifyMFAToken(firstCode, user.mfaSecret);
    if (!isFirstValid) {
      return res.status(400).json({
        status: 'failed',
        message: 'First code is invalid',
        data: null
      });
    }

    const isSecondValid = verifyMFAToken(secondCode, user.mfaSecret);
    if (!isSecondValid) {
      return res.status(400).json({
        status: 'failed',
        message: 'Second code is invalid',
        data: null
      });
    }

    if (firstCode === secondCode) {
      return res.status(400).json({
        status: 'failed',
        message: 'Codes must be different. Wait for the timer to change.',
        data: null
      });
    }

    user.isMFAEnabled = true;
    await user.save();

    res.json({
      status: 'success',
      message: 'MFA enabled successfully',
      data: null
    });

  } catch (error) {
    console.error('MFA Verify Setup Error:', error);
    res.status(500).json({
      status: 'failed',
      message: 'Failed to verify MFA setup',
      data: null
    });
  }
};

const verifyMFALogin = async (req, res) => {
  try {
    const { userId, token, backupCode } = req.body;

    const user = await User.findById(userId);

    if (!user || !user.isMFAEnabled || !user.mfaSecret) {
      return res.status(400).json({
        status: 'failed',
        message: 'MFA not enabled',
        data: null
      });
    }

    let isValid = false;
    let usedBackupCode = false;

    if (token) {
      isValid = verifyMFAToken(token, user.mfaSecret);
    }

    if (!isValid && backupCode) {
      isValid = await verifyBackupCode(backupCode, user.mfaBackupCodes);
      if (isValid) {
        usedBackupCode = true;
        const normalizedCode = backupCode.toUpperCase().replace(/-/g, '');
        const index = user.mfaBackupCodes.findIndex(hashed =>
          bcrypt.compareSync(normalizedCode, hashed)
        );
        if (index > -1) {
          user.mfaBackupCodes.splice(index, 1);
          await user.save();
        }
      }
    }

    if (!isValid) {
      return res.status(401).json({
        status: 'failed',
        message: 'Invalid MFA code or backup code',
        data: {
          remainingBackupCodes: user.mfaBackupCodes?.length || 0
        }
      });
    }

    res.json({
      status: 'success',
      message: 'MFA verified',
      data: {
        verified: true,
        usedBackupCode
      }
    });

  } catch (error) {
    console.error('MFA Verify Login Error:', error);
    res.status(500).json({
      status: 'failed',
      message: 'Verification failed',
      data: null
    });
  }
};

module.exports = {
  setupMFA,
  verifyMFASetup,
  verifyMFALogin
};