const User = require("../model/user");
const SuperUser = require("../model/superUser");
const jwt = require("jsonwebtoken");

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
    const decoded = jwt.verify(req.params.token, process.env.EMAIL_SECRET);
    const mail = decoded;
    const user = await User.findOne({ email: mail.user_email });
    if (!user) return res.status(400).json({ message: "user not found" });
    if (!user.isVerified)
      return res
        .status(400)
        .json({ message: "User is not verified. Kindly verify your account" });

    return res.status(200).json({
      userEmail: user.email,
    });
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