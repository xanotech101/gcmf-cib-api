const Account = require("../model/account");
const bcrypt = require("bcrypt");
const { validateAccountSignup } = require("../utils/utils");
const jwt = require("jsonwebtoken");
const _ = require("lodash");
const Joi = require("joi");

//@desc     register an account
//@route    POST /account/register
//@access   Public
const registerAccount = async (req, res) => {
  try {
    console.log(req.body);
    const { error } = validateAccountSignup(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    //Hash password
    const salt = await bcrypt.genSalt(10);
    // const hashedPassword = await bcrypt.hash(password, salt);
    bcrypt.hash(req.body.password, salt, function (err, hash) {
      if (err) return next(err);

      req.body.password = hash;
    });

    const { randomUUID } = require("crypto");
    const account = new Account({
      organizationId: randomUUID(),
      accountImageUrl: req.body.accountImageUrl,
      address: req.body.address,
      password: req.body.password
    });

    let result = await account.save();

    console.log(result);
    return res.status(201).send(result);
  } catch (error) {
    return res.status(500).json({
      status: "Failed",
      Message: "Unable to create an account",
    });
  }
};
module.exports = registerAccount;
