const Account = require("../model/account");
const jwt = require("jsonwebtoken");
const _ = require("lodash");
const User = require("../model/user.model");
const { sendEmail } = require("../utils/emailService");
const Privilege = require("../model/privilege.model");
let csvToJson = require("convert-csv-to-json");
const fs = require("fs");
const excelToJson = require("convert-excel-to-json");
const bankOneService = require("../services/bankOne.service");
const authToken = process.env.AUTHTOKEN;


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
      organizationLabel: input.accountDetails.organizationLabel,
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


//onboard multiple accounts
const bulkOnboard = async (req, res) => {
  try {
    const excelDocs = ["xlsx", "xls"];
    const csvDocs = ["csv"];

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        message: "No files uploaded. Please upload at least one file",
        status: "failed",
      });
    }

    let formattedData = [];

    for (let i = 0; i < req.files.length; i++) {
      let file = req.files[i];
      let fileExtension = file.originalname.split(".")[1];
      let data;

      if (excelDocs.includes(fileExtension)) {
        data = excelToJson({
          sourceFile: file.path,
          header: {
            rows: 1,
          },
          columnToKey: {
            "*": "{{columnHeader}}",
          },
        });

        let result;
        for (let i in data) {
          result = i;
          break;
        }
        formattedData = formattedData.concat(data[result]);

      } else if (csvDocs.includes(fileExtension)) {
        data = csvToJson.fieldDelimiter(",").getJsonFromCsv(file.path);
        formattedData = formattedData.concat(data);
      } else {
        return res.status(400).json({
          message: "Invalid file type. Please upload a csv or excel file",
          status: "failed",
        });
      }

      fs.unlinkSync(file.path);
    }

    // Convert account data and add admin ID
    const accounts = formattedData.map((obj) => ({
      firstName: obj.FIRSTNAME ? obj.FIRSTNAME.trim() : "",
      lastName: obj.LASTNAME ? obj.LASTNAME.trim() : "",
      email: obj.USEREMAIL ? obj.USEREMAIL.trim() : "",
      phone: obj.PHONENUMBER ? obj.PHONENUMBER.trim() : "",
      gender: obj.GENDER ? obj.GENDER.trim() : "",
      imageUrl: obj.IMAGEURL ? obj.IMAGEURL.trim() : "",
      accountNumber: obj.ACCOUNTNUMBER ? obj.ACCOUNTNUMBER.trim() : "",
      accountName: obj.ACCOUNTNAME ? obj.ACCOUNTNAME.trim() : "",
      customerID: obj.CUSTOMERID ? obj.CUSTOMERID.trim() : "",
      accountemail: obj.ACCOUNTEMAIL ? obj.ACCOUNTEMAIL.trim() : "",
    }));

    // Perform account creation
    const createdAccounts = [];
    const invalidAccount = []

    for (const account of accounts) {
      const input = {
        admin: {
          firstName: account.firstName,
          lastName: account.lastName,
          email: account.email,
          phone: account.phone,
          gender: account.gender,
          imageUrl: account.imageUrl,
        },
        accountDetails: {
          accountNumber: account.accountNumber,
          accountName: account.accountName,
          customerID: account.customerID,
          email: account.accountemail,
        },
      };

      const checkAccountNum = await bankOneService.BulkOnboardingaccountByAccountNo(
        input.accountDetails.accountNumber,
        authToken
      );

      if (!checkAccountNum) {
        invalidAccount.push(
          {
            message: 'unable to resolve this account',
            accountName: input.accountDetails,
            checkAccountNum
          }

        )
      } else {
        let role = 'admin';

        const privilege = await Privilege.findOne({ name: 'admin' });
        const admin = await User.create({
          ...input.admin,
          token: '',
          role,
          privileges: [privilege._id],
        });

        const token = jwt.sign(
          { accountDetails: account.accountNumber },
          process.env.EMAIL_SECRET,
          {
            expiresIn: '10h',
          }
        )

        // create account
        const result = await Account.create({
          ...input.accountDetails,
          adminId: admin._id,
          accountToken: token,
          adminID: admin._id,
          organizationLabel: req.body.organizationLabel,
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

        sendEmail(accountEmail, subject, 'verify-account', messageData);

        createdAccounts.push(result)
      }
    }

    // Return the created accounts
    return res.status(201).json({
      status: "Success",
      accounts: createdAccounts,
      invalidAccounts: invalidAccount
    });
  } catch (error) {
    console.log(error)
    return res.status(500).send({
      success: false,
      messsage: error
    })
  }
}


const getAllAccountsByLabel = async (req, res) => {
  try {
    const PAGE_SIZE = 10; // Number of accounts per page

    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * PAGE_SIZE;

    const organizationLabel = req.params.organizationlabel;

    // Find accounts based on organizationLabel
    const accounts = await Account.find({ organizationLabel })
      .skip(skip)
      .limit(PAGE_SIZE);

    // Return the accounts
    return res.status(200).json({
      status: 'Success',
      accounts,
    });
  } catch (error) {
    console.log(error)
    return res.status(500).send({
      success: false,
      messsage: error.message
    })
  }
}
module.exports = { getAllAccount, registerAccount, verifyAccount, getAccount, bulkOnboard, getAllAccountsByLabel };
