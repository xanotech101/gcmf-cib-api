const Account = require("../model/account");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const _ = require("lodash");
const Joi = require("joi");
const User = require("../model/user.model");
const { log } = require("console");
const { sendEmail } = require("../utils/emailService");
const { randomUUID } = require("crypto");

//@desc     register an account
//@route    POST /account/register
//@access   Public
const registerAccount = async (req, res) => {
  // console.log(req.user);
  try {
    const input = _.pick(req.body, ["admin", "accountDetails"]);
    // get user details through adminId

    // create account admin
    let role = "admin";

    const admin = await User.create({
      ...input.admin,
      role,
    });

    const token = jwt.sign(
      { user_email: admin.email },
      process.env.EMAIL_SECRET,
      {
        expiresIn: "10m",
      }
    );

    // create account
    const result = await Account.create({
      ...input.accountDetails,
      adminId: admin._id,
      organizationId: randomUUID(),
      accountToken: token,
    });

    // const result = await account.save();

    // send email to admin
    const email = admin.email;
    const subject = "Account Verification";
    const message = `Hello ${admin.firstName}, \n\n
    Please verify your account by clicking the link: \nhttp://localhost:8000/verify-account/${token}.\n`;
    // await sendEmail(email, subject, message);
    return res.status(201).json({
      status: "Success",
      result,
      token,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "Failed",
      Message: "Unable to create an account",
    });
  }
};

//  verify account
const verifyAccount = async (req, res) => {
  try {
    const token = req.params.token;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res.status(400).json({
        status: "Failed",
        Message: "Invalid token",
      });
    }

    const account = Account.findOne({ accountToken: token });
    if (!account) {
      return res.status(400).json({
        status: "Failed",
        Message: "Account not found",
      });
    }

    if (account.verified) {
      return res.status(400).json({
        status: "Failed",
        Message: "Account is already verified",
      });
    }

    const user = await User.findById(account.adminId);
    // update user secret here
    user.isVerified = true;
    user.secrets = req.body.secrets;
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);

    account.verified = true;
    account.accountToken = null;
    await account.save();
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "Failed",
      Message: "Unable to verify account",
    });
  }
};
module.exports = { registerAccount, verifyAccount };

/*
Admin:{
    "firstName" : "Adekunle",
    "lastName" : "Omolaja",
    "email": "week@test.com",
    "password" : "user1234",
    "confirm_password" : "user1234",
    "designation": "Client Admin",
    "phone": "01349957638",
    "gender": "male",   
    "organizationId" : "4747fdedede",
    "imageUrl" : "google.com/fsdfdsfdd",
    "privileges" : ["63f697fd134e96cd95e2d97b"],
}

*/
