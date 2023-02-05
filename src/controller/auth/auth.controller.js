const User = require("../../model/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { sendEmail } = require("../../utils/emailService");

//@desc     Login User
//@route    POST /users/login
//@access   Public
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).send({
        data: null,
        message: "Invalid email or password",
        status: "failed",
      });
    }

    if (!user.isVerified) {
      return res.status(403).send({
        data: null,
        message: "User is still yet to be verified on the platform",
        status: "failed",
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(400).send({
        data: null,
        message: "Invalid email or password",
        status: "failed",
      });
    }

    const token = user.generateAuthToken();

    res.json({
      message: "User Logged in Successfully",
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    console.log("🚀 ~ file: auth.controller.js:51 ~ login ~ error", error)
    res.status(500).json({
      status: "failed",
      message: "Unable to login user",
      data: null,
    });
  }
};

//@desc     confirm email inorder to change user password. Send email to user
//@route    POST /users/send_password_reset_link"
//@access   Public
const forgetPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      res.status(400).json({
        message:
          "If the mail you inputed is registered on the platform, you will get a mail to change you password",
        data: null,
        status: "failed",
      });
    }

    //Email Details
    const token = jwt.sign(
      { user_email: user.email },
      process.env.EMAIL_SECRET,
      {
        expiresIn: "15m",
      }
    );

    const link = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    const subject = "Password Reset Link";
    const message = `
    <h3>Password Reset</h3>
    <p>Dear ${user.firstName}, There was a request to change your password</p> 
    <p>We want to be sure you made this request. If you did, kindly click the link below to reset your password. Please note that this link will expire in 15 minutes.</p> 
    <a href= ${link}><h4>CLICK HERE TO RESET YOUR PASSWORD</h4></a> 
    <p>If the above link is not working, You can click the link below.</p>
    <p>${link}</p>
  `;

    await sendEmail(user.email, subject, message);

    res.status(200).json({
      status: "success",
      message:
        "If the mail you inputed is registered on the platform, you will get a mail to change you password",
      data: null,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "failed",
      Message: "Unable to verify email",
    });
  }
};

const verifyUser = async (req, res) => {
  try {
    const decoded = jwt.verify(req.params.token, process.env.EMAIL_SECRET);
    const mail = decoded;

    if (!mail) {
      res.status(400).json({
        status: "failed",
        Message: "Invalid token",
        data: null,
      });
    }

    const user = await User.findOne({ email: mail.user_email });

    if (!user) {
      return res.status(400).json({
        status: "failed",
        Message: "User not found",
        data: null,
      });
    }

    user.isVerified = true;
    await user.save();

    return res.status(200).json({
      message: "User verified successfully",
      data: null,
      status: "success",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "failed",
      Message: "Unable to verify user",
      data: null,
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { password, token } = req.body;
    const decoded = jwt.verify(token, process.env.EMAIL_SECRET);
    let userEmail = decoded.user_email;

    const user = await User.findOne({ email: userEmail });

    //Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();
    return res.status(200).json({ 
      status: "success",
      message: "Password changed successfully",
      data: null,
     });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "failed",
      data: null,
      message: "Unable to verify user",
    });
  }
};

const registerUser = async (req, res) => {
  try {
    const userExits = await User.findOne({ email: req.body.email });

    if (userExits) {
      return res.status(400).send({
        status: "failed",
        data: null,
        message: "User is already registered",
      });
    }

    let role = "user";

    if (req.path === "/super_admin/register") {
      role = "super-admin";
    } else if (req.path === "/admin/register") {
      role = "admin";
    }

    const user = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      password: req.body.password,
      email: req.body.email,
      designation: req.body.designation,
      phone: req.body.phone,
      gender: req.body.gender,
      organizationId: req.body.organizationId,
      imageUrl: req.body.imageUrl,
      privileges: req.body.privileges,
      role,
    });

    //Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);

    //Email Details
    const token = jwt.sign(
      { user_email: user.email },
      process.env.EMAIL_SECRET,
      {
        expiresIn: "30m",
      }
    );

    const link = `${process.env.FRONTEND_URL}/verify-account/${token}`;

    const subject = "Welcome on Board";
    const message = `
    <h3>You have successfully created your account</h3>
    <p>Dear ${user.firstName}, welcome on board.</p> 
    <p>Kinldy click below to confirm your account.</p> 
    <a href= ${link}><h4>CLICK HERE TO CONFIRM YOUR EMAIL</h4></a> 
    <p>If the above link is not working, You can click the link below.</p>
    <p>${link}</p>
  `;

    await sendEmail(user.email, subject, message);

    await user.save();

    return res.status(201).json({
      message:
        "Verification code has been sent to your email. To continue, please verify your email.",
      status: "success",
      data: { user },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "failed",
      data: null,
      message: "Unable to create a user",
    });
  }
};

module.exports = {
  verifyUser,
  forgetPassword,
  login,
  resetPassword,
  registerUser,
};
