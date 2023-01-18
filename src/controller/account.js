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


    const { randomUUID } = require("crypto");
    const account = new Account({
      organizationId: randomUUID(),
      accountImageUrl: req.body.accountImageUrl,
      address: req.body.address,
      password: req.body.password,
    });

    //Hash password
    const salt = await bcrypt.genSalt(10);
    account.password = await bcrypt.hash(account.password, salt);
    let result = await account.save();

    return res.status(201).send(_.pick(result, ["organizationId", "accountImageUrl", "address"]));
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "Failed",
      Message: "Unable to create an account",
    });
  }
};
module.exports = registerAccount;
