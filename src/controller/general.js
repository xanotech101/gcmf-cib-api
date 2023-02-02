const Mandate = require("../model/mandate");
const InitiateRequest = require("../model/initiateRequest");
const { validateInitiateRequestSchema } = require("../utils/utils");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const { sendEmail } = require("../utils/emailService");
const uuid = require("uuid");
let csvToJson = require("convert-csv-to-json");
const fs = require("fs");

const initiateRequest = async (req, res) => {
  try {
    // if (
    //   !req.user.priviledge.includes("initiator") ||
    //   !req.user.priviledge.includes("admin") ||
    //   req.user.priviledge.includes("superAdmin")
    // )
    //   return res
    //     .status(403)
    //     .json({ message: "You are unauthorised to make this request." });

    const { error } = validateInitiateRequestSchema(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    // let initiateRequest = await InitiateRequest.find({
    //   accountNumber: req.user.accountNumber,
    // });
    // if (!user) return res.status(404).json({ message: "User not found" });

    let request = new InitiateRequest({
      requestID: uniqueRandomID,
      customerName: req.body.customerName,
      amount: req.body.amount,
      bankName: req.body.bankName,
      accountNumber: req.body.accountNumber,
      accountName: req.body.accountName,
    });

    let mandate = await Mandate.find({}).select(
      "minAmount maxAmount AuthorizerID"
    );

    let authorizerID;
    let emails = [];

    mandate.map((item) => {
      if (
        request.amount >= item.minAmount &&
        request.amount <= item.maxAmount
      ) {
        authorizerID = item.AuthorizerID;
      }
    });

    // authorizerID.forEach(item => {
    //   let user = await User.find({ _id: item.authorizerID }).select("email")
    //   emails.push(user)
    // })

    let result = await request.save();

    return res.status(201).json({
      message: "Inititate request succesfully sent for approval",
      "Request Details": result,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

const batchUpload = async (req, res) => {
  try {
    let data = csvToJson.fieldDelimiter(",").getJsonFromCsv(req.file.path);

    fs.unlinkSync(req.file.path);
    res.status(200).json({ message: "File uploaded successfully", data });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

const updateRequest = async (req, res) => {
  try {
    let id = req.params.id;
    let request = await InitiateRequestfind({ _id: id.toString });
    request.declineResponse = req.body.declineResponse;
    await request.save();

    return res.status(200).json({
      message: "Dissaproval Messaged received",
      request,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { initiateRequest, batchUpload, updateRequest };
