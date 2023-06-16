const { sendSMS } = require("../../services/sms.service");
const crypto = require("crypto");
const User = require("../../model/user.model");
const { sendEmail } = require("../../utils/emailService");
const Otp = require("../../model/otp.model");
const initiateRequestModel = require("../../model/initiateRequest.model");
const uuid = require("uuid");
const { default: mongoose } = require("mongoose");

const generateOTP = async (req, res) => {
  try {
    const id = req.user;
    const user = await User.findById(id)
    const { context, transaction } = req.body;

    const otp = crypto.randomBytes(3).toString("hex");
    const smsBody = `Your GCMB confirmation OTP code is ${otp}.`;

    let num = `${user.phone}`;
    if (/^080|^081|^070|^071|^090|^091/.test(num)) {
      // Replace the first 0 with +234
      num = num.replace(/^0/, "+234");
    } else if (/^\+2340/.test(num)) {
      // Remove the first 0
      num = num.replace(/^0/, "");
    }


    let newOtp = {}

    const otpRecord = await Otp.findOne({
      user: user._id,
      transaction,
      context,
    });

    if (!otpRecord) {
      // create one and send to the user
      newOtp = new Otp({
        user: user._id,
        transaction,
        context,
        otp,
      });
    } else {
      newOtp = otpRecord;
      newOtp.otp = otp;
    }

    await newOtp.save();

    await sendSMS(num, smsBody);

    const subject = "Verification Code";
    const messageData = {
      firstName: user.firstName,
      otp: otp,
      message: 'Your OTP is ready',
      year: new Date().getFullYear()
    }

    await sendEmail(user.email, subject, 'otp', messageData);

    return res.status(200).json({
      message: "Successfully sent otp code",
      data: otp,
      status: "success",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error.message,
      data: null,
      status: "failed",
    });
  }
};

const generateOtpForBatchUpload = async (req, res) => {
  try {
    const id = req.user;
    const user = await User.findById(id)
    const transactionIds = req.body.transaction

    const otp = crypto.randomBytes(3).toString("hex");
    const smsBody = `Your Bulk verification code is ${otp}.`;

    let num = `${user.phone}`;
    if (num.startsWith("0")) {
      num = num.replace("0", "+234");
    }

    let newOtp = {}

    //check if the requested transactions are pending or in review
    const checkForTransactionIds = await initiateRequestModel.find({ $or: [{ _id: { $in: transactionIds }, status: "pending" }, { _id: { $in: transactionIds }, status: "in progress" }, { _id: { $in: transactionIds }, status: "awaiting authorization" }] })
    if (checkForTransactionIds.length !== transactionIds.length) {
      return res.status(400).send({ message: 'Some of these transactions do not exist or are not pending.' })
    }

    let batchVerificationIDs = []
    let mismatch = false
    for (let i = 0; i < checkForTransactionIds.length; i++) {
      const batchVerificationID = checkForTransactionIds[i].batchVerificationID
      if (!batchVerificationID) {
        mismatch = true
        break
      }
      batchVerificationIDs.push(batchVerificationID)
    }

    let newBatchverificationID = null
    if (mismatch || [...new Set(batchVerificationIDs)].length > 1) {
      newBatchverificationID = new mongoose.Types.ObjectId(); // generate new 5 digit batchverification ID
      const updateCollection = await initiateRequestModel.updateMany(
        { _id: { $in: transactionIds } },
        { $set: { batchVerificationID: newBatchverificationID } }
      )
      if (!updateCollection.modifiedCount > 0) {
        return res.status(400).send({ message: 'Error updating batchverification ID' })
      }
    } else {
      newBatchverificationID = batchVerificationIDs[0]
    }

    const otpRecord = await Otp.findOne({
      user: user._id,
      transaction: newBatchverificationID,
      context: req.body.context,
    });

    if (!otpRecord) {
      // create one and send to the user
      newOtp = new Otp({
        user: user._id,
        transaction: newBatchverificationID,
        context: req.body.context,
        otp,
      });
    } else {
      newOtp = otpRecord;
      newOtp.otp = otp;
    }

    await newOtp.save();

    await sendSMS(num, smsBody);

    const subject = "Verification Code";
    const messageData = {
      firstName: user.firstName,
      otp: otp,
      message: 'Your OTP is ready',
      year: new Date().getFullYear()
    }

    await sendEmail(user.email, subject, 'otp', messageData);

    return res.status(200).json({
      message: "Successfully sent otp code",
      data: otp,
      status: "success",
      batchID: newBatchverificationID
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error.message,
      data: null,
      status: "failed",
    });
  }
}

const disableUserOtp = async(req, res) => {
  try {
    const id = req.user;
    const user = await User.findById(id)

    const otp = crypto.randomBytes(3).toString("hex");
    const smsBody = `Your confirmation OTP code is ${otp}.`;

    let num = `${user.phone}`;
    if (/^080|^081|^070|^071|^090|^091/.test(num)) {
      // Replace the first 0 with +234
      num = num.replace(/^0/, "+234");
    } else if (/^\+2340/.test(num)) {
      // Remove the first 0
      num = num.replace(/^0/, "");
    }


    let newOtp = {}

    const otpRecord = await Otp.findOne({
      user: user._id,
      context: 'disable user',
    });

    if (!otpRecord) {
      // create one and send to the user
      newOtp = new Otp({
        user: user._id,
        context:"disable user",
        otp,
      });
    } else {
      newOtp = otpRecord;
      newOtp.otp = otp;
    }

    await newOtp.save();

    await sendSMS(num, smsBody);

    const subject = "Confirmation Code";
    const messageData = {
      firstName: user.firstName,
      otp: otp,
      message: 'Your OTP is ready',
      year: new Date().getFullYear()
    }

    await sendEmail(user.email, subject, 'otp', messageData);

    return res.status(200).json({
      message: "Successfully sent otp code",
      data: otp,
      status: "success",
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error.message,
      data: null,
      status: "failed",
    });
  }
}

const enableUserOtp = async(req, res) => {
  try {
    const id = req.user;
    const user = await User.findById(id)

    const otp = crypto.randomBytes(3).toString("hex");
    const smsBody = `Your confirmation OTP code is ${otp}.`;

    let num = `${user.phone}`;
    if (/^080|^081|^070|^071|^090|^091/.test(num)) {
      // Replace the first 0 with +234
      num = num.replace(/^0/, "+234");
    } else if (/^\+2340/.test(num)) {
      // Remove the first 0
      num = num.replace(/^0/, "");
    }


    let newOtp = {}

    const otpRecord = await Otp.findOne({
      user: user._id,
      context: 'enable user',
    });

    if (!otpRecord) {
      // create one and send to the user
      newOtp = new Otp({
        user: user._id,
        context:"enable user",
        otp,
      });
    } else {
      newOtp = otpRecord;
      newOtp.otp = otp;
    }

    await newOtp.save();

    await sendSMS(num, smsBody);

    const subject = "Confirmation Code";
    const messageData = {
      firstName: user.firstName,
      otp: otp,
      message: 'Your OTP is ready',
      year: new Date().getFullYear()
    }

    await sendEmail(user.email, subject, 'otp', messageData);

    return res.status(200).json({
      message: "Successfully sent otp code",
      data: otp,
      status: "success",
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error.message,
      data: null,
      status: "failed",
    });
  }
}

const Update_emailOTP = async (req, res) => {
  try {
    const id = req.user;
    const user = await User.findById(id)
    const { context } = req.body;

    const otp = crypto.randomBytes(3).toString("hex");
    const smsBody = `Your GCMB confirmation OTP code is ${otp}.`;

    let num = `${user.phone}`;
    if (/^080|^081|^070|^071|^090|^091/.test(num)) {
      // Replace the first 0 with +234
      num = num.replace(/^0/, "+234");
    } else if (/^\+2340/.test(num)) {
      // Remove the first 0
      num = num.replace(/^0/, "");
    }


    let newOtp = {}

    const otpRecord = await Otp.findOne({
      user: user._id,
      context,
    });

    if (!otpRecord) {
      // create one and send to the user
      newOtp = new Otp({
        user: user._id,
        context,
        otp,
      });
    } else {
      newOtp = otpRecord;
      newOtp.otp = otp;
    }

    await newOtp.save();

    await sendSMS(num, smsBody);

    const subject = "Verification Code";
    const messageData = {
      firstName: user.firstName,
      otp: otp,
      message: 'Update Email OTP is ready',
      year: new Date().getFullYear()
    }

    await sendEmail(user.email, subject, 'otp', messageData);

    return res.status(200).json({
      message: "Successfully sent otp code",
      data: otp,
      status: "success",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error.message,
      data: null,
      status: "failed",
    });
  }
};

module.exports = {
  generateOTP, 
  generateOtpForBatchUpload,
  disableUserOtp,
  enableUserOtp,
  Update_emailOTP
};
