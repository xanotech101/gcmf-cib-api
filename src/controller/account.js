const Account = require("../model/account");
const jwt = require("jsonwebtoken");
const _ = require("lodash");
const User = require("../model/user.model");
const { sendEmail } = require("../utils/emailService");
const Privilege = require("../model/privilege.model");

const registerAccount = async (req, res) => {
  try {
    const input = _.pick(req.body, ["admin", "accountDetails"]);

    let role = "admin";

    const privilege = await Privilege.findOne({ name: "admin" });
    const admin = await User.create({
      ...input.admin,
      token: "",
      role,
      privileges: [privilege._id]
    });



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


    const accountEmail = input.accountDetails.email;
    const subject = "Account Verification";
    const messageData = {
      firstName: admin.firstName,
      url: `${process.env.FRONTEND_URL}/auth/account/verify-account/${token}`,
      message: 'click the link to verify your account',
      year: new Date().getUTCFullYear()
    }

    await sendEmail(accountEmail, subject, 'verify-account', messageData);

    return res.status(201).json({
      status: "Success",
      result,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "Failed",
      Message: error.message ?? "Unable to create an account",
    });
  }
};


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
    const messageData = {
      firstName: user.firstName,
      url: `${process.env.FRONTEND_URL}/verify-account/${userToken}`,
      message: 'click the link to verify your account ',
      year: new Date().getUTCFullYear()
    }
    sendEmail(userEmail, subject, 'verify-email', messageData);

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
