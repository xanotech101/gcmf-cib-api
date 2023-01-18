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

    const account = new Account({
      accountImageUrl: req.body.accountImageUrl,
      address: req.body.address,
    });

    let result = await account.save();
    
console.log(result);
    return res
      .status(201)
      .send(result );
  } catch (error) {
    return res.status(500).json({
      status: "Failed",
      Message: "Unable to create an account",
    });
  }
};
module.exports = registerAccount;
