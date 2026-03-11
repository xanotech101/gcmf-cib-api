const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const bcrypt = require('bcryptjs');

const generateMFASecret = async (username, serviceName = 'MyBank') => {
  const secret = speakeasy.generateSecret({
    name: `${serviceName} (${username})`,
    length: 32,
    issuer: serviceName
  });

  const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);
  const backupCodes = generateBackupCodes(10, 8);

  return {
    secret: secret.base32,
    qrCode: qrCodeDataUrl,
    backupCodes,
    otpauthUrl: secret.otpauth_url
  };
};

const generateBackupCodes = (count, length) => {
  const codes = [];
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  for (let i = 0; i < count; i++) {
    let code = '';
    for (let j = 0; j < length; j++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }

  return codes;
};

const verifyMFAToken = (token, secret) => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 1
  });
};

const verifyBackupCode = async (code, hashedBackupCodes) => {
  const normalizedCode = code.toUpperCase().replace(/-/g, '');

  for (const hashedCode of hashedBackupCodes) {
    const match = await bcrypt.compare(normalizedCode, hashedCode);
    if (match) return true;
  }

  return false;
};

module.exports = {
  generateMFASecret,
  verifyMFAToken,
  verifyBackupCode
};