const User = require("../model/user");
const bcrypt = require("bcrypt");
const validate = require("../utils/utils");
const jwt = require("jsonwebtoken");
const _ = require("lodash");

//@desc     register a user
//@route    POST /users/register
//@access   Public
const registerUser = async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const userExits = await User.findOne({ email: req.body.email });
  if (userExits)
    res.status(400).json({ message: "User is already registered" });

 let user = new User(
    _.pick(req.body, [
      "firstName",
      "lastName",
      "email",
      "designation",
      "phone",
      "gender",
      "organizationId",
      "image",
      "privilege",
    ])
  );
  //Hash password
  const salt = await bcrypt.genSalt(10);
   user.password = await bcrypt.hash(password, salt);
    await user.save();
};

module.exports = registerUser;
