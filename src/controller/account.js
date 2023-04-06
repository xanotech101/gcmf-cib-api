const Account = require("../model/account");
const AuthorisationKey = require("../model/authorisationKey");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const _ = require("lodash");
const Joi = require("joi");
const User = require("../model/user.model");
const { log } = require("console");
const { sendEmail } = require("../utils/emailService");
const { randomUUID } = require("crypto");
const bankOneService = require("../services/bankOne.service");
const authToken = process.env.AUTHTOKEN;
const Privilege = require("../model/privilege.model");

//@desc     register an account
//@route    POST /account/register
//@access   Public

const registerAccount = async (req, res) => {
  try {
    const input = _.pick(req.body, ["admin", "accountDetails"]);

    const privileges = await Privilege.find();
    let priviledgeList = privileges.map(privilege => privilege._id)
    let role = "admin";
    let adminToken = jwt.sign(
      { user_email: input.admin.email },
      process.env.EMAIL_SECRET,
      {
        expiresIn: "10m",
      }
    );

    const admin = await User.create({
      ...input.admin,
      token: "",
      role,
      privileges: priviledgeList
    });

    // console.log(Email, CustomerId);
    const token = jwt.sign(
      { accountDetails: input.accountDetails.accountNumber },
      process.env.EMAIL_SECRET,
      {
        expiresIn: "10h",
      }
    );
    // create account
    const result = await Account.create({
      ...input.accountDetails,
      adminId: admin._id,
      accountToken: token,
      adminID: admin._id,
      customerID: input.accountDetails.customerID,
    });

    // update admin organization id
    admin.organizationId = result._id;
    await admin.save();

    // send email to admin
    // var origin = req.headers.origin;
    const accountEmail = input.accountDetails.email;
    const subject = "Account Verification";
    const accountMessage = `Hello, \n An account has been created by you for ${admin.firstName} \n\n
    Please verify the account creation by clicking the link: \n${process.env.FRONTEND_URL}/auth/account/verify-account/${token}.\n`;

    await sendEmail(accountEmail, subject, accountMessage);

    return res.status(201).json({
      status: "Success",
      result,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "Failed",
      Message: error.message ??  "Unable to create an account",
    });
  }
};
//  verify account
//  verify account
const verifyAccount = async (req, res) => {
  try {
    const token = req.params.token;

    const decoded = jwt.verify(token, process.env.EMAIL_SECRET);
    if (!decoded) {
      return res.status(400).json({
        status: "Failed",
        Message: "Invalid token",
      });
    }

    const account = await Account.findOne({
      accountNumber: decoded.accountDetails,
    });

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

    const user = await User.findById(account.adminID);
    const userToken = jwt.sign(
      { email: user.email },
      process.env.EMAIL_SECRET,
      {
        expiresIn: "10h",
      }
    );

    const userEmail = user.email;
    const subject = "Account Verification";
    const accountMessage = `Hello,${user.firstName} ${user.lastName} \n An account has been created for you  \n\n
    Please verify the account creation by clicking the link: \n${process.env.FRONTEND_URL}/verify-account/${userToken}.\n`;

    await sendEmail(userEmail, subject, accountMessage);

    account.verified = true;
    account.accountToken = null;

    user.verificationToken = userToken;
    await account.save();
    await user.save();
    return res.status(201).json({
      status: "Success",
      userToken,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "Failed",
      Message: "Unable to verify account",
    });
  }
};

// const sendAccountVericationPin = async (req, res) => {
//   let accountNo = req.query.account;
//   let institutionCode = req.query.institutionCode;

//   const accountInfo = await bankOneService.getAccountInfo(
//     authToken,
//     account,
//     institutionCode
//   );
//   if (!accountInfo) {
//     return res.status(500).json({
//       status: "Failed",
//       message: "Unable to get bank account details",
//     });
//   }

//   let authorisationKey = randomUUID();
//   const authorisationKeyModel = new AuthorisationKey({
//     bankNumber: accountNo,
//     token: authorisationKey,
//   });
//   await authorisationKeyModel.save();

//   const accountEmail = accountInfo.Message.Email;
//   const name = accountInfo.Message.Name;

//   //Mail notification
//   const subject = "Request to connect your account";
//   const message = `
//           <h3>Transaction Request Initiated</h3>
//           <p> Dear ${name}. There is a request to connect your account to the GMFB platform for transactional purpose.</p>
//           <p>Kindly find below the authorisation key to verify you are authorizing this action</p>
//           <p>Verification Key: ${authorisationKey}</p>
//         `;

//   await sendEmail(accountEmail, subject, message);

//   return res.status(200).json({
//     status: "Success",
//     message: "Account Details retrieved successfully",
//     data: accountInfo,
//   });
// };

// get all account
const getAllAccount = async (req, res) => {
  try {
    const name = req.query.name;
    if (name) {
      const allAccount = await Account.find({ accountName: { $regex: name, $options: "i" } }).populate("adminID");

      return res.status(200).json({
        status: "Success",
        data: allAccount,
      });

    }
    const allAccount = await Account.find().populate("adminID");

    return res.status(200).json({
      status: "Success",
      data: allAccount,
    });
  } catch (error) {
    res.status(500).send({
      status: "Failed",
      message: "Unable to get all account",
    });
  }
};

const getAccount = async (req, res) => {
  try {
    const account = await Account.findById(req.params.id).populate("adminID");
    res.status(200).json({
      status: "Success",
      data: account,
    });
  } catch (error) {
    res.status(500).send({
      status: "Failed",
      message: "Unable to get account",
      error: error.message,
    });
  }
}

module.exports = { getAllAccount, registerAccount, verifyAccount, getAccount };
