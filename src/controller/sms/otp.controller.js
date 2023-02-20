const { sendSMS } = require("../../services/sms.service");
const crypto = require("crypto");
const User = require("../../model/user.model");
const { sendEmail } = require("../../utils/emailService");

const generateOTP = async (req, res) => {
  try {
    const id = req.user._id;
    const user = await User.findById(id);
    console.log(user);

    const otp = crypto.randomBytes(3).toString("hex");
    const smsBody = `Your GCMB confirmation OTP code is ${otp}.`;

    let num = `${user.phone}`;
    if (num.startsWith("0")) {
      num = num.replace("0", "+234");
    }
    console.log("num", num, typeof num);
    await sendSMS(num, smsBody);

    const subject = "Verification Code";
    const message = `${user.firstName}, Your GCMB confirmation OTP code is ${otp}.`;
    
    console.log("sms sent");
    await sendEmail(user.email, subject, message);
    console.log("email sent");
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
