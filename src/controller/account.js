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
const { default: mongoose } = require("mongoose");
const initiateRequestModel = require("../model/initiateRequest.model");
const otpModel = require("../model/otp.model");
const { userService, auditTrailService } = require("../services");
const { getDateAndTime } = require("../utils/utils");
const authToken = process.env.AUTHTOKEN;
const Organization = require("../model/organization");


function isValidEmail(email) {
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailPattern.test(email);
}

function isValidPhoneNumber(phoneNumber) {
  const phoneNumberPattern = /^\+?.{8,}$/;
  return phoneNumberPattern.test(phoneNumber);
}

const registerAccount = async (req, res) => {
  try {
    const input = _.pick(req.body, ["admin", "accountDetails"]);

    let role = "admin";

    const privilege = await Privilege.findOne({ name: "admin" });

    console.log(input.accountDetails.email, input.admin.email, 'random Email')

    // Validate account email
    if (!isValidEmail(input.accountDetails.email)) {
      const errorMessage = 'Invalid account email format';
      return res.status(400).json({
        success: false,
        message: errorMessage
      });
    }

    // Validate admin email
    if (!isValidEmail(input.admin.email)) {
      const errorMessage = 'Invalid admin email format';
      return res.status(400).json({
        success: false,
        message: errorMessage
      });
    }

    if (!isValidPhoneNumber(input.admin.phone)) {
      const errorMessage = 'Invalid admin phone number format';
      return res.status(400).json({
        success: false,
        message: errorMessage
      })
    }

    // Check if admin already exists
    const checkAdmin = await User.findOne({ email: input.admin.email });

    if (checkAdmin) {
      return res.status(400).json({
        status: "Failed",
        message: "Admin already exists",
      });
    }

    // Check if account already exists
    // Check if any account number already exists
    const duplicateAccounts = await Account.find({
      accountNumber: { $in: input.accountDetails.accountNumber },
    });

    if (duplicateAccounts.length > 0) {

      return res.status(400).json({
        status: "Failed",
        message: "Duplicate account number(s) found",
        duplicateAccounts,
      });
    }


    const admin = await User.create({
      ...input.admin,
      token: "",
      role,
      privileges: [privilege._id],
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
      firstName: input.accountDetails.accountName,
      url: `${process.env.FRONTEND_URL}/auth/account/verify-account/${token}`,
      message: "click the link to verify your account, Please note this link will expire after 10 hours",
      year: new Date().getUTCFullYear(),
    };

    await sendEmail(accountEmail, subject, "verify-account", messageData);

    return res.status(201).json({
      status: "Success",
      result,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      status: "Failed",
      message: error.message || "Unable to create an account",
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
      message: "click the link to verify your account, please note this link will expire after 10 hours",
      year: new Date().getUTCFullYear(),
    };
    sendEmail(userEmail, subject, "verify-email", messageData);

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
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 10;

    const name = req.query.name;
    let query = {};

    if (name) {
      query = {
        accountName: { $regex: name, $options: "i" },
      };
    }

    const totalCount = await Account.countDocuments(query);
    const totalPages = Math.ceil(totalCount / perPage);

    const allAccount = await Account.find(query)
      .skip((page - 1) * perPage)
      .limit(perPage)
      .populate("adminID");

    return res.status(200).json({
      status: "Success",
      data: {
        currentPage: page,
        perPage,
        totalCount,
        totalPages,
        accounts: allAccount,
      },
    });
  } catch (error) {
    res.status(500).send({
      status: "Failed",
      message: "Unable to get all accounts",
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
};

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
      firstName: obj.ADMIN_FIRSTNAME ? obj.ADMIN_FIRSTNAME.trim() : "",
      lastName: obj.ADMIN_LASTNAME ? obj.ADMIN_LASTNAME.trim() : "",
      email: obj.ADMIN_EMAIL ? obj.ADMIN_EMAIL.trim() : "",
      phone: obj.ADMIN_PHONE_NUMBER ? obj.ADMIN_PHONE_NUMBER.trim() : "",
      gender: obj.GENDER ? obj.GENDER.trim() : "",
      accountNumber: obj.ACCOUNT_NUMBER ? obj.ACCOUNT_NUMBER.trim() : "",
      accountName: obj.ACCOUNT_NAME ? obj.ACCOUNT_NAME.trim() : "",
      accountemail: obj.ACCOUNT_EMAIL ? obj.ACCOUNT_EMAIL.trim() : "",
    }));

    // Perform account creation
    const createdAccounts = [];
    const invalidAccount = [];
    const duplicateUsers = [];
    const duplicateAccounts = [];

    for (const account of accounts) {
      const input = {
        admin: {
          firstName: account.firstName,
          lastName: account.lastName,
          email: account.email,
          phone: account.phone,
          gender: account.gender,
        },
        accountDetails: {
          accountNumber: [account.accountNumber], // Store accountNumber as an array
          accountName: account.accountName,
          customerID: "",
          email: account.accountemail,
        },
      };

      // Check if any required fields are missing
      const missingFields = Object.entries(input.admin).filter(([key, value]) => !value).map(([key]) => key);

      if (missingFields.length > 0) {
        invalidAccount.push({
          message: "Missing fields in admin",
          account: input.admin,
          missingFields: missingFields,
        });
        continue; // Skip processing this account
      }

      // Check if any required fields are missing for the account details
      const missingAccountFields = Object.entries(input.accountDetails).filter(([key, value]) => !value && key !== 'customerID' && key !== 'accountName').map(([key]) => key);

      if (missingAccountFields.length > 0) {
        invalidAccount.push({
          message: "Missing fields in accountDetails",
          account: input.accountDetails,
          missingFields: missingAccountFields,
        });
        continue; // Skip processing this account
      }

      if (!isValidEmail(input.admin.email)) {
        const errorMessage = 'Invalid admin email format';
        invalidAccount.push({
          message: errorMessage,
          account: input.admin,
        });
        continue
      }

      if (!isValidEmail(input.accountDetails.email)) {
        const errorMessage = 'Invalid acount email format';
        invalidAccount.push({
          message: errorMessage,
          account: input.admin,
        });
        continue
      }

      if (!isValidPhoneNumber(input.admin.phone)) {
        const errorMessage = 'Invalid admin phone number format';
        invalidAccount.push({
          message: errorMessage,
          account: input.admin,
        });
        continue;
      }

      const checkAccountNum = await bankOneService.BulkOnboardingaccountByAccountNo(input.accountDetails.accountNumber, authToken);

      if (!checkAccountNum) {
        invalidAccount.push({
          message: "Unable to resolve this account",
          account: input.accountDetails,
        });
        continue; // Skip creating this account and admin
      }


      input.accountDetails.customerID = checkAccountNum.customerID;

      input.accountDetails.accountName = input.accountDetails.accountName === "" ? `${checkAccountNum.LastName} ${checkAccountNum.OtherNames}` : input.accountDetails.accountName

      const checkAdmin = await User.findOne({ email: input.admin.email });

      if (checkAdmin) {
        duplicateUsers.push({
          message: "This user already exists",
          account: input.admin,
        });
        continue; // Skip creating this account and admin
      }

      const privilege = await Privilege.findOne({ name: "admin" });

      const admin = await User.create({
        ...input.admin,
        token: "",
        role: "admin",
        privileges: [privilege._id],
      });

      const checkAccount = await Account.findOne({ accountNumber: { $in: input.accountDetails.accountNumber } });

      if (checkAccount) {
        await User.findByIdAndDelete(admin._id); // Delete the created admin
        duplicateAccounts.push({
          message: "This account number already exists",
          account: input.accountDetails,
        });
        continue; // Skip creating this account and admin
      }

      const token = jwt.sign({ accountDetails: account.accountNumber }, process.env.EMAIL_SECRET, {
        expiresIn: "10h",
      });

      const result = await Account.create({
        ...input.accountDetails,
        adminId: admin._id,
        accountToken: token,
        adminID: admin._id,
        organizationLabel: req.body.organizationLabel,
        customerID: input.accountDetails.customerID,
      });

      admin.organizationId = result._id;
      await admin.save();

      const accountEmail = input.accountDetails.email;
      const subject = "Account Verification";
      const messageData = {
        firstName: input.accountDetails.accountName,
        url: `${process.env.FRONTEND_URL}/auth/account/verify-account/${token}`,
        message: "Click the link to verify your account",
        year: new Date().getUTCFullYear(),
      };

      sendEmail(accountEmail, subject, "verify-account", messageData);

      createdAccounts.push(result);
    }

    // Return the created accounts
    const errors = [].concat(invalidAccount, duplicateUsers, duplicateAccounts);

    return res.status(201).json({
      message: "Accounts created successfully",
      status: "Success",
      accounts: createdAccounts,
      invalidAccounts: invalidAccount,
      duplicateUsers: duplicateUsers,
      duplicateAccounts: duplicateAccounts,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: error,
    });
  }
};


const getAllAccountsByLabel = async (req, res) => {
  try {
    const perPage = parseInt(req.query.perPage) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * perPage;
    const filterAccountName = req.query.name || '';

    const requestLabel = await Organization.findOne({ _id: req.user.organizationLabel});

    if (!requestLabel) {
      return res.status(400).send({
        success: false,
        message: 'No organization with that label'
      });
    }

    // Prepare the filter for accountName
    const accountNameFilter = filterAccountName
      ? { accountName: { $regex: filterAccountName, $options: 'i' } }
      : {};

    // Find accounts based on organizationLabel and accountName filter
    const accounts = await Account.find({
      organizationLabel: requestLabel._id,
      ...accountNameFilter,
    })
      .skip(skip)
      .limit(perPage)
      .sort({ _id: -1 })
      .populate('adminID')
      .populate('organizationLabel');

    const totalCount = await Account.countDocuments({
      organizationLabel: requestLabel._id,
      ...accountNameFilter,
    });

    // Return the accounts
    return res.status(200).json({
      status: 'Success',
      data: {
        currentPage: page,
        totalCount,
        totalPages: Math.ceil(totalCount / perPage),
        accounts,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};


const getOrganizationStats = async (req, res) => {
  try {
    const { organizationId } = req.params;

    // Check if organization exists
    const existingOrganization = await Account.findOne({ _id: organizationId });
    if (!existingOrganization) {
      return res.status(400).send({
        success: false,
        message: 'Organization does not exist',
      });
    }

    // Get number of users
    const totalUsers = await User.countDocuments({ organizationId: organizationId });

    // Get total successful transfers
    const totalSuccessfulTransfers = await initiateRequestModel.countDocuments({
      organizationId: organizationId,
      transferStatus: 'successful',
    });

    // Get total failed transfers
    const totalFailedTransfers = await initiateRequestModel.countDocuments({
      organizationId: organizationId,
      transferStatus: 'failed',
    });

    // Get total money disbursed
    const totalMoneyDisbursed = await initiateRequestModel.aggregate([
      {
        $match: {
          organizationId: mongoose.Types.ObjectId(organizationId),
          transferStatus: 'successful',
        },
      },
      {
        $group: {
          _id: null,
          amount: { $sum: '$amount' },
        },
      },
    ]);

    const totalAmountDisbursed = totalMoneyDisbursed.length > 0 ? totalMoneyDisbursed[0].amount : 0;

    return res.status(200).json({
      success: true,
      totalUsers: totalUsers,
      totalSuccessfulTransfers: totalSuccessfulTransfers,
      totalFailedTransfers: totalFailedTransfers,
      totalAmountDisbursed: totalAmountDisbursed,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};


const disableAccount = async (req, res) => {
  try {
    const checkAccount = await Account.findOne({ _id: req.params.id })
    if (!checkAccount) {
      return res.status(400).send({
        success: false,
        message: 'Account not found on this system'
      })
    }

    if (checkAccount.disabled === true) {
      return res.status(400).send({
        success: false,
        message: 'this account is already disabled'
      })
    }

    // check for otp
    const checkOtp = await otpModel.findOne({ user: req.user._id, otp: req.body.otp, context: 'disable account' })
    if (!checkOtp) {
      return res.status(400).send({
        success: false,
        message: 'invalid otp'
      })
    }

    const disable_account = await Account.updateOne({ _id: req.params.id }, { $set: { disabled: true } })
    const user = await userService.getUserById(req.user._id);
    const { date, time } = getDateAndTime();

    if (disable_account.modifiedCount > 0) {
      //create audit trial
      const auditTrail = {
        user: req.user._id,
        type: "disable account",
        message: `${user.firstName} ${user.lastName} disabled ${checkAccount.accountName} co-operate account on ${date} by ${time}`,
      };
      await auditTrailService.createAuditTrail(auditTrail)
      checkOtp.delete()
      return res.status(200).send({
        success: true,
        message: 'Account successfully disabled'
      })
    }
    return res.status(500).send({
      success: false,
      message: 'Error disabling account'
    })
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: error.message
    })
  }
}

const enableAccount = async (req, res) => {
  try {
    const checkAccount = await Account.findOne({ _id: req.params.id })

    if (!checkAccount) {
      return res.status(400).send({
        success: false,
        message: 'account not found on this system'
      })
    }

    const checkOtp = await otpModel.findOne({ user: req.user._id, otp: req.body.otp, context: 'enable account' })

    if (!checkOtp) {
      return res.status(400).send({
        success: false,
        message: 'Invalid OTP'
      })
    }

    if (checkAccount.disabled === false) {
      return res.status(400).send({
        success: false,
        message: 'this account is already enabled'
      })
    }

    const enable_account = await Account.updateOne({ _id: req.params.id }, { $set: { disabled: false } })
    const user = await userService.getUserById(req.user._id);

    const { date, time } = getDateAndTime();
    if (enable_account.modifiedCount > 0) {
      const auditTrail = {
        user: req.user._id,
        type: "enable account",
        message: `${user.firstName} ${user.lastName} enabled ${checkAccount.accountName} cooperate account on ${date} by ${time}`,
      };

      await auditTrailService.createAuditTrail(auditTrail)
      checkOtp.delete()

      return res.status(200).send({
        success: true,
        message: 'Account successfully enable'
      })
    }

    return res.status(500).send({
      success: false,
      message: 'Error enabling account'
    })
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: error.message
    })
  }
}


module.exports = {
  getAllAccount,
  registerAccount,
  verifyAccount,
  getAccount,
  bulkOnboard,
  getAllAccountsByLabel,
  getOrganizationStats,
  disableAccount,
  enableAccount
};
