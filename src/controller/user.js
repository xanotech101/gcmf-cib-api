const User = require("../model/user");
const bcrypt = require("bcrypt");
const {
  validateUserSchema,
  validateForgetUserPasswordSchema,
  validateChangePasswordSchema,
  validateUserLoginSchema,
} = require("../utils/utils");
const jwt = require("jsonwebtoken");
const _ = require("lodash");
const Joi = require("joi");
const { sendEmail } = require("../utils/emailService");



//@desc     register a user
//@route    POST /users/register
//@access   Public
const registerUser = async (req, res) => {
  try {
    const { error } = validateUserSchema(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const userExits = await User.findOne({ email: req.body.email });
    if (userExits)
      return res.status(400).json({ message: "User is already registered" });

    // let user = new User({
    //   firstName: req.body.firstName,
    //   lastName: req.body.lastName,
    //   password: req.body.password,
    //   email: req.body.email,
    //   password: req.body.password,
    //   designation: req.body.designation,
    //   phone: req.body.phone,
    //   gender: req.body.gender,
    //   organizationId: req.body.organizationId,
    //   imageUrl: req.body.imageUrl,
    //   priviledge: req.body.priviledge,
    // });

    let user = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      password: req.body.password,
      email: req.body.email,
      password: req.body.password,
      designation: req.body.designation,
      phone: req.body.phone,
      gender: req.body.gender,
      organizationId: req.body.organizationId,
      imageUrl: req.body.imageUrl,
      priviledge: req.body.priviledge,
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
    const link = `${process.env.BASE_URL}/users/confirmation/${token}`;

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

    const result = await user.save();

    return res.status(201).json({
      message:
        "Verification code has been sent to your email. To continue, please verify your email.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "Failed",
      Message: "Unable to create a user",
    });
  }
};




//@desc     confirm email inorder to change user password. Send email to user
//@route    POST /users/send_password_reset_link"
//@access   Public
const forgetPassword = async (req, res) => {
  try {
    const { error } = validateForgetUserPasswordSchema(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const user = await User.findOne({ email: req.body.email });
    if (!user)
      return res.status(400).json({
        message:
          "If the mail you inputed is registered on the platform, you will get a mail to change you password",
      });

    //Email Details
    const token = jwt.sign(
      { user_email: user.email },
      process.env.EMAIL_SECRET,
      {
        expiresIn: "15m",
      }
    );
    const link = `${process.env.BASE_URL}/users/reset_password/${token}`;

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

    return res.status(200).json({
      message:
        "If the mail you inputed is registered on the platform, you will get a mail to change you password",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "Failed",
      Message: "Unable to verify email",
    });
  }
};



//@desc     Reset User's password
//@route    POST /users/reset_password
//@access   Private
const changePassword = async (req, res) => {

  try {
    const { error } = validateChangePasswordSchema(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const { email, password } = req.body;
    const user = await User.findOne({ email });

    //Hash password
    const salt = await bcrypt.genSalt(10);
    console.log(password)
    user.password = await bcrypt.hash(password, salt);

    await user.save();
    return res.status(200).json({ message: "Password changed successfully" });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "Failed",
      Message: "Unable to change user password",
    });
  }
};







//@desc     Reset User's password
//@route    POST /users/reset_password
//@access   Private
const userLogin = async (req, res) => {
  console.log(req.header);
  try {
    const { error } = validateUserLoginSchema(req.body);
    if (error) return res.status(400).send(error.details[0].message);

      const user = await User.findOne({ email: req.body.email });
       if (!user)
           res.status(400).json({ message: "Invalid email or password" });
        
        const validPassword = await bcrypt.compare(req.body.password, user.password);
        if (!validPassword)
            res.status(400).json({ message: "Invalid email or password" });
        
        const token = user.generateAuthToken();
        res.json({ message: "User Logged in Successfully", accessToken: token });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "Login Failed",
      Message: "Unable to login user"
    });
  }
};






module.exports = {
  changePassword,
  registerUser,
  forgetPassword,
  userLogin,
};