const User = require("../model/user");
const jwt = require("jsonwebtoken");

const verifyUser = async (req, res) => {
  try {
    const decoded = jwt.verify(req.params.token, process.env.EMAIL_SECRET);
    const mail = decoded;
    const user = await User.findOne({ email: mail.user_email });
    if (!user) throw "user not found";
    user.isVerified = true;
    await user.save();

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

    return res.status(200).json({
      message: user.email
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