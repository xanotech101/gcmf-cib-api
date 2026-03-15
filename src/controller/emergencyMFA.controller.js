const User = require('../model/user.model');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../utils/emailService');
const { sendSMS } = require('../services/sms.service');

// Store temporary tokens (use Redis in production)
const tempTokens = new Map();

/**
 * Step 1: Send email verification link
 * POST /api/emergency-mfa/send-email
 */
const sendEmergencyEmail = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                status: 'failed',
                message: 'Email not found',
                data: null
            });
        }

        if (!user.isMFAEnabled) {
            return res.status(400).json({
                status: 'failed',
                message: 'MFA not enabled for this account',
                data: null
            });
        }

        // Generate email verification token (15 min expiry)
        const emailToken = jwt.sign(
            { userId: user._id, step: 'email_verified' },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        // Store in temp memory (use Redis in production)
        tempTokens.set(user._id.toString(), { emailToken, step: 'email_sent' });

        // Send verification email
        const verificationLink = `${process.env.FRONTEND_URL}/emergency-mfa/verify-email?token=${emailToken}`;

        await sendEmail(
            user.email,
            'Emergency MFA Reset - Email Verification',
            'emergency-mfa-email',
            {
                firstName: user.firstName,
                verificationLink,
                year: new Date().getFullYear()
            }
        );

        res.json({
            status: 'success',
            message: 'Verification email sent. Please check your inbox.',
            data: {
                emailSent: true,
                maskedEmail: maskEmail(user.email)
            }
        });

    } catch (error) {
        console.error('Emergency Email Error:', error);
        res.status(500).json({
            status: 'failed',
            message: 'Failed to send email',
            data: null
        });
    }
};

/**
 * Step 2: Verify email link and send phone OTP
 * POST /api/emergency-mfa/verify-email
 */
const verifyEmailAndSendOTP = async (req, res) => {
    try {
        const { token, phoneNumber } = req.body;

        // Verify email token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({
                status: 'failed',
                message: 'Invalid or expired email link',
                data: null
            });
        }

        if (decoded.step !== 'email_verified') {
            return res.status(400).json({
                status: 'failed',
                message: 'Invalid verification step',
                data: null
            });
        }

        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(404).json({
                status: 'failed',
                message: 'User not found',
                data: null
            });
        }

        // Check if phone number matches user's phone
        if (user.phone !== phoneNumber) {
            return res.status(400).json({
                status: 'failed',
                message: 'Phone number does not match our records',
                data: null
            });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store OTP with expiry (10 minutes)
        const otpToken = jwt.sign(
            { userId: user._id, otp, step: 'phone_verification' },
            process.env.JWT_SECRET,
            { expiresIn: '10m' }
        );

        tempTokens.set(user._id.toString(), {
            ...tempTokens.get(user._id.toString()),
            otpToken,
            step: 'otp_sent'
        });

        // Send SMS
        await sendSMS(
            user.phone,
            `Your MyBank emergency MFA reset code is: ${otp}. Valid for 10 minutes. Do not share this code.`
        );

        res.json({
            status: 'success',
            message: 'OTP sent to your phone',
            data: {
                otpSent: true,
                maskedPhone: maskPhone(user.phone)
            }
        });

    } catch (error) {
        console.error('Verify Email Error:', error);
        res.status(500).json({
            status: 'failed',
            message: 'Failed to verify email',
            data: null
        });
    }
};

/**
 * Step 3: Verify phone OTP and login
 * POST /api/emergency-mfa/verify-phone
 */
const verifyPhoneAndLogin = async (req, res) => {
    try {
        const { otpToken, otp } = req.body;

        // Verify OTP token
        let decoded;
        try {
            decoded = jwt.verify(otpToken, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({
                status: 'failed',
                message: 'Invalid or expired OTP session',
                data: null
            });
        }

        if (decoded.step !== 'phone_verification') {
            return res.status(400).json({
                status: 'failed',
                message: 'Invalid verification step',
                data: null
            });
        }

        // Verify OTP matches
        if (decoded.otp !== otp) {
            return res.status(401).json({
                status: 'failed',
                message: 'Invalid OTP',
                data: null
            });
        }

        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(404).json({
                status: 'failed',
                message: 'User not found',
                data: null
            });
        }

        // Clear temp token
        tempTokens.delete(user._id.toString());

        // Generate emergency login token (short-lived, MFA bypass flag)
        const emergencyToken = jwt.sign(
            {
                _id: user._id,
                organizationId: user.organizationId,
                privileges: user.privileges,
                firstName: user.firstName,
                emergencyMFA: true, // Flag to allow MFA disable
                mfaBypass: true
            },
            process.env.JWT_SECRET,
            { expiresIn: '15m' } // Short session - must disable MFA quickly
        );

        res.json({
            status: 'success',
            message: 'Emergency verification complete. Please disable MFA immediately.',
            data: {
                token: emergencyToken,
                user,
                requiresMFADisable: true,
                sessionExpiresIn: '15 minutes'
            }
        });

    } catch (error) {
        console.error('Verify Phone Error:', error);
        res.status(500).json({
            status: 'failed',
            message: 'Failed to verify OTP',
            data: null
        });
    }
};

// Helper functions
const maskEmail = (email) => {
    const [name, domain] = email.split('@');
    const maskedName = name.slice(0, 2) + '***' + name.slice(-1);
    return `${maskedName}@${domain}`;
};

const maskPhone = (phone) => {
    return phone.slice(0, 3) + '****' + phone.slice(-3);
};

module.exports = {
    sendEmergencyEmail,
    verifyEmailAndSendOTP,
    verifyPhoneAndLogin
};