const { sendSMS } = require("../../services/sms.service");
const crypto = require("crypto");
const User = require("../../model/user.model");
const { sendEmail } = require("../../utils/emailService");
const Otp = require("../../model/otp.model");

const generateOTP = async (req, res) => {
  try {
    const id = req.user._id;
    const user = await User.findById(id)
    console.log(user);

    const otp = crypto.randomBytes(3).toString("hex");
    const smsBody = `Your GCMB confirmation OTP code is ${otp}.`;

    let num = `${user.phone}`;
    if (num.startsWith("0")) {
      num = num.replace("0", "+234");
    }
    await sendSMS(num, smsBody);

    const newOtp = new Otp({
      user: id,
      context: 'transaction-request',
      otp
    });

    await newOtp.save();


    const subject = "Verification Code";
    const message = `${user.firstName}, Your GCMB confirmation OTP code is ${otp}.`;

    await sendEmail(user.email, subject, message);
    res.status(200).json({
      message: "Successfully sent otp code",
      data: otp,
      status: "success",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error.message,
      data: null,
      status: "failed",
    });
  }
};

module.exports = generateOTP;
