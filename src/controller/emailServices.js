const User = require("../model/user");
const SuperUser = require("../model/superUser");
const jwt = require("jsonwebtoken");
const {
  validateChangePasswordSchema,
} = require("../utils/utils");
const bcrypt = require("bcrypt");




const verifyUser = async (req, res) => {
  try {
    const decoded = jwt.verify(req.params.token, process.env.EMAIL_SECRET);
    const mail = decoded;
    const user = await User.findOne({ email: mail.user_email });
    if (!user) throw "user not found";
    user.isVerified = true;
    await user.save();

    return res.status(200).json({
      message: "User verified successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "Failed",
      Message: "Unable to verify user",
    });
  }
};

const getNewPassword = async (req, res) => {
  try {
     const { error } = validateChangePasswordSchema(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const { password, confirm_password, token } = req.body;
    const decoded = jwt.verify(token, process.env.EMAIL_SECRET);
    let userEmail = decoded.user_email

    const user = await User.findOne({ email: userEmail });

    //Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();
    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "Failed",
      Message: "Unable to verify user",
    });
  }
};




const verifySuperUser = async (req, res) => {
  try {
    console.log("i am here")
    const decoded = jwt.verify(req.params.token, process.env.EMAIL_SECRET);
    const mail = decoded;
    const superUser = await SuperUser.findOne({ email: mail.user_email });
    if (!superUser) throw "user not found";
   superUser.isVerified = true;
    let result = await superUser.save();

    return res.status(200).json({
      message: "User verified successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "Failed",
      Message: "Unable to verify user",

    });
  }
};

module.exports = {
  verifyUser,
  getNewPassword,
  verifySuperUser
};