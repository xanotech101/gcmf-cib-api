const User = require("../model/user");
const jwt = require("jsonwebtoken");

const verifyUser = async (req, res) => {
    try {
    const decoded = jwt.verify(req.params.token, process.env.EMAIL_SECRET);
        const mail = decoded
	const user = await User.findOne( { email: mail.user_email} );
	if (!user) throw "user not found";
    user.isVerified = true;
        await user.save();
        
        return res.redirect(
            `${process.env.BASE_URL}/users/login`);
        
} catch (error) {
        console.log(error);
        return res.status(500).json({
            status: "Failed",
            Message: "Unable to verify user",
        });
    }
}




const verifyForgetPassword = async (req, res) => {
  try {
    const decoded = jwt.verify(req.params.token, process.env.EMAIL_SECRET);
    const mail = decoded;
    const user = await User.findOne({ email: mail.user_email });
    if (!user) throw "user not found";

      return res.redirect(`${process.env.BASE_URL}/users/change_password`).status(200).json({
          status: "Success",
          token: req.params.token
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
  verifyForgetPassword
};
