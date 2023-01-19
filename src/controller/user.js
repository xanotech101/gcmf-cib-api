const User = require("../model/user");
const bcrypt = require("bcrypt");
const { validateUserSchema } = require("../utils/utils");
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
      res.status(400).json({ message: "User is already registered" });

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
    const token = jwt.sign({ user_email: user.email }, process.env.EMAIL_SECRET, {
      expiresIn: "30m",
    });
    const link = `${process.env.BASE_URL}/users/confirmation/${token}`;
    const message = `
    <h3>You have successfully created your account</h3>
    <p>Dear ${user.firstName}, welcome on board.</p> 
    <p>Kinldy click below to confirm your account.</p> 
    <a href= ${link}><h4>CLICK HERE TO CONFIRM YOUR EMAIL</h4></a> 
    <p>If the above link is not working, You can click the link below.</p>
    <p>${link}</p>
  `;
    const subject = "Welcome on Board";

    await sendEmail(user.email, subject, message);

    let code = Math.floor(100000 + Math.random() * 900000);
    user.verificationCode = code;
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
module.exports = registerUser;
