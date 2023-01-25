const SuperUser = require("../model/user");
const bcrypt = require("bcrypt");
const {
  validateSuperUserSchema,
  validateForgetUserPasswordSchema,
  validateChangePasswordSchema,
  validateUserLoginSchema,
} = require("../utils/utils");
const jwt = require("jsonwebtoken");
const _ = require("lodash");
const Joi = require("joi");
const { sendEmail } = require("../utils/emailService");

//@desc     register a Super User
//@route    POST /super_users/register
//@access   Public
const registerSuperUser = async (req, res) => {
    console.log("I am here")
  try {
    const { error } = validateSuperUserSchema(req.body);
    if (error) return res.status(400).send(error.details[0].message);

      const SuperUserExits = await SuperUser.findOne({ email: req.body.email });
      console.log(SuperUserExits)
    if (SuperUserExits)
      return res.status(400).json({ message: "User is already registered" });

    let superUser = new SuperUser({
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

      console.log(superUser)
    //Hash password
    const salt = await bcrypt.genSalt(10);
    superUser.password = await bcrypt.hash(superUser.password, salt);

    //Email Details
    const token = jwt.sign(
      { user_email: superUser.email },
      process.env.EMAIL_SECRET,
      {
        expiresIn: "30m",
      }
    );
    const link = `${process.env.BASE_URL}/users/register_confirmation/${token}`;

    const subject = "Welcome on Board";
    const message = `
    <h3>You have successfully created your account</h3>
    <p>Dear ${superUser.firstName}, welcome on board.</p> 
    <p>Kinldy click below to confirm your account.</p> 
    <a href= ${link}><h4>CLICK HERE TO CONFIRM YOUR EMAIL</h4></a> 
    <p>If the above link is not working, You can click the link below.</p>
    <p>${link}</p>
  `;

    await sendEmail(superUser.email, subject, message);

    const result = await superUser.save();

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

    const superUser = await SuperUser.findOne({ email: req.body.email });
    if (!superUser)
      return res.status(400).json({
        message:
          "If the mail you inputed is registered on the platform, you will get a mail to change you password",
      });

    //Email Details
    const token = jwt.sign(
      { user_email: superUser.email },
      process.env.EMAIL_SECRET,
      {
        expiresIn: "15m",
      }
    );
    const link = `${process.env.BASE_URL}/users/reset_password/${token}`;

    const subject = "Password Reset Link";
    const message = `
    <h3>Password Reset</h3>
    <p>Dear ${superUser.firstName}, There was a request to change your password</p> 
    <p>We want to be sure you made this request. If you did, kindly click the link below to reset your password. Please note that this link will expire in 15 minutes.</p> 
    <a href= ${link}><h4>CLICK HERE TO RESET YOUR PASSWORD</h4></a> 
    <p>If the above link is not working, You can click the link below.</p>
    <p>${link}</p>
  `;

    await sendEmail(superUser.email, subject, message);

    return res.status(200).json({
      message:
        "If the mail you inputed is registered on the platform, you will get a mail to change you password",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "failed",
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
    const superUser = await SuperUser.findOne({ email });

    //Hash password
    const salt = await bcrypt.genSalt(10);
    console.log(password);
    superUser.password = await bcrypt.hash(password, salt);

    await superUser.save();
    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "Failed",
      Message: "Unable to change user password",
    });
  }
};

//@desc     Login User
//@route    POST /users/login
//@access   Public
const superUserLogin = async (req, res) => {
  console.log(req.header);
  try {
    const { error } = validateUserLoginSchema(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const superUser = await User.findOne({ email: req.body.email });
    if (!user) res.status(400).json({ message: "Invalid email or password" });

    const validPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!validPassword)
      res.status(400).json({ message: "Invalid email or password" });

    const token = superUser.generateAuthToken();
    res.json({ message: "User Logged in Successfully", accessToken: token });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "Login Failed",
      Message: "Unable to login user",
    });
  }
};

module.exports = {
  changePassword,
  registerSuperUser,
  forgetPassword,
  superUserLogin,
};
