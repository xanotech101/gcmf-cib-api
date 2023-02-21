const multer = require("multer");
let csvToJson = require("convert-csv-to-json");
const fs = require("fs");
const excelToJson = require("convert-excel-to-json");
const Mandate = require("../model/mandate.model");
const User = require("../model/user.model");
const InitiateRequest = require("../model/initiateRequest.model");
const { validateInitiateRequestSchema } = require("../utils/utils");

const batchUpload = async (req, res) => {
  try {
    let data;
    const excelDocs = ["xlsx", "xls"];
    const csvDocs = ["csv"];

    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded. Please upload a file",
        status: "failed",
      });
    }

    let fileExtension = req.file.originalname.split(".")[1];
    let formattedFile;

    if (excelDocs.includes(fileExtension)) {
      data = excelToJson({
        sourceFile: req.file.path,
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
      formattedFile = data[result];
    } else if (csvDocs.includes(fileExtension)) {
      data = csvToJson.fieldDelimiter(",").getJsonFromCsv(req.file.path);
      formattedFile = data;
    } else {
      return res.status(400).json({
        message: "Invalid file type. Please upload a csv or excel file",
        status: "failed",
      });
    }

    fs.unlinkSync(req.file.path);

    // process file here
    for (let i = 0; i < formattedFile.length; i++) {
      const datum = formattedFile[i];
      let request = new InitiateRequest({
        customerName: datum.customerName,
        amount: datum.amount,
        bankName: datum.bankName,
        accountNumber: datum.accountNumber,
        accountName: datum.accountName,
        initiator: req.user._id,
        status: "pending",
      });

      const mandates = await Mandate.find().select("minAmount maxAmount");

      let emails = [];

      mandates.map((mandate) => {
        if (
          request.amount >= mandate.minAmount &&
          request.amount <= mandate.maxAmount
        ) {
          //Send email logic here
          //.....
          // await sendEmail()
          request.mandate = mandate._id;
          request.verifier = mandate.verifier;
        }
      });

      request.initiator = req.user._id;
      await request.save();
    }

    // return response to user here while processing file
    res.status(200).json({
      message: "File uploaded successfully",
      status: "success",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      status: "failed",
    });
  }
};

module.exports = batchUpload;
