const User = require("../model/user");
const jwt = require("jsonwebtoken");

const verifyUser = async (req, res) => {
    console.log("user verified");
  try {
    const decoded = jwt.verify(req.params.token, process.env.EMAIL_SECRET);
    const mail = decoded;
    const user = await User.findOne({ email: mail.user_email });
    if (!user) throw "user not found";
    user.isVerified = true;
    await user.save();
    console.log("user verified");
    console.log(process.env.BASE_URL);
    return res.status(200).redirect(`${process.env.BASE_URL}/users/login`);
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
    if (!user) return res.status(400).json({ message: "user not found" })
    if (!user.isVerified) return res.status(400).json({ message: "User is not verified. Kindly verify your account" });

    return res.status(200).json({
      userEmail: user.email
    })

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
};




