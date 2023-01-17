const User = require("../model/user");
const bcrypt = require("bcrypt");
const validateUser = require("../utils/utils");
const jwt = require("jsonwebtoken");
const _ = require("lodash");
const Joi = require("joi");

//@desc     register a user
//@route    POST /users/register
//@access   Public
const registerUser = async (req, res) => {
  const { error } = validateUser(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const userExits = await User.findOne({ email: req.body.email });
  if (userExits)
    res.status(400).json({ message: "User is already registered" });

  let user = new User(
    _.pick(req.body, [
      "firstName",
      "lastName",
      "email",
      "password",
      "designation",
      "phone",
      "gender",
      "organizationId",
      "imageUrl",
      "privilege",
    ])
  );
  //Hash password
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(req.body.password, salt);
  let result = await user.save();

  res
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
        "privilege",
      ])
    );
};

module.exports = registerUser;



