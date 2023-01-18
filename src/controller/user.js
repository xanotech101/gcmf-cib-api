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
    console.log("heheh")

    const userExits = await User.findOne({ email: req.body.email });
    if (userExits)
      res.status(400).json({ message: "User is already registered" });

    let user = new User({
      firstName : req.body.firstName,
      lastName: req.body.lastName,
      password: req.body.password,
      email: req.body.email,
      password: req.body.password,
      designation : req.body.designation,
      phone: req.body.phone,
      gender : req.body.gender,
      organizationId : req.body.organizationId,
      imageUrl : req.body.imageUrl,
      priviledge : req.body.priviledge
    }
    );

    //Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);

     await sendEmail(user.firstName, user.email, 456);
    const result = await user.save();

    

    return res
      .status(201)
      .send(
        _.pick(result, [
          "firstName",
          "lastName",
          "email",
          "designation",
          "phone",
          "gender",
          "organizationId",
          "imageUrl",
          "priviledge",
        ])
      );
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      
      status: "Failed",
      Message: "Unable to create a user",
    });
  }
};
module.exports = registerUser;
