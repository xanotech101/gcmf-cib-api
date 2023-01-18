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
    const { error } = validateAccountSignup(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    let account = new Account(_.pick(req.body, ["imageUrl", "address"]));

    let result = await account.save();

    return res
      .status(201)
      .send(_.pick(result, ["imageUrl", "address"]) );
  } catch (error) {
    return res.status(500).json({
      status: "Failed",
      Message: "Unable to create an account",
    });
  }
};
module.exports = registerAccount;
