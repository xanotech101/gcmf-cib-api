const User = require("../model/user");
const bcrypt = require("bcrypt");
const { validateUserSchema } = require("../utils/utils");
const jwt = require("jsonwebtoken");
const _ = require("lodash");
const Joi = require("joi");

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

    let user = new User(
      _.pick(req.body, [
        "firstName,",
        "lastName",
        "password",
        "email",
        "designation",
        "phone",
        "gender",
        "organizationId",
        "imageUrl",
        "priviledge",
      ])
    );
    //Hash password
    const salt = await bcrypt.genSalt(10);
    // const hashedPassword = await bcrypt.hash(password, salt);
    bcrypt.hash(user.password, salt, function (err, hash) {
      if (err) return next(err);

      user.password = hash;
    });

    return res
      .status(201)
      .send(
        _.pick(user, [
          "firstName",
          "lastName",
          "email",
          "designation",
          "phone",
          "gender",
          "organizationId",
          "imageUrl",
          "privilege",
        ])
      );
  } catch (error) {
    return res.status(500).json({
      status: "Failed",
      Message: "Unable to create a user",
    });
  }
};
module.exports = registerUser;
