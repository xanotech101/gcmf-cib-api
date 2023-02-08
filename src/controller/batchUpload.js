const multer = require("multer");
let csvToJson = require("convert-csv-to-json");
const fs = require("fs");
const excelToJson = require("convert-excel-to-json");
const Mandate = require("../model/mandate");
const User = require("../model/user.model");
const InitiateRequest = require("../model/initiateRequest");
const { validateInitiateRequestSchema } = require("../utils/utils");



const batchUpload = async (req, res) => {
  console.log(req.file)
  try {
    let data;
    let excelDocs = ["xlsx", "xls"];
    let csvDocs = ["csv"];


    if (
      req.file == null ||
      req.file?.originalname == "undefined" ||
      req.file == undefined
    ) {
      return res.status(400).json({ message: "No file uploaded. Please upload a file" });
    }

    let fileExtension = req.file.originalname.split(".")[1];
    let datum;
    
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
         datum = data[result]; 
    } else if (csvDocs.includes(fileExtension)) {
      data = csvToJson.fieldDelimiter(",").getJsonFromCsv(req.file.path);
      datum = data;
    } else {
      return res.status(400).json({ message: "Invalid file type. Please upload a csv or excel file" });
    };

    fs.unlinkSync(req.file.path);


 
    for (let i = 0; i < datum.length; i++){
      let request = new InitiateRequest({
            customerName: datum[i].customerName,
            amount: datum[i].amount,
            bankName: datum[i].bankName,
            accountNumber: datum[i].accountNumber,
            accountName: datum[i].accountName,
          });
          let mandate = await Mandate.find({}).select(
            "minAmount maxAmount AuthorizerID"
          );
          let authorizerIDArr = [];
          let emails = [];
          let mandateID;
          let authorizerID;
          mandate.map((item) => {
            if (
              request.amount >= item.minAmount &&
              request.amount <= item.maxAmount
            ) {
              //Send email logic here
              //.....
              // await sendEmail()
              authorizerID = item.AuthorizerID;
              mandateID = item._id;
            }
            authorizerIDArr.push(authorizerID);
          });
         
          //TODO: code duplication, you don't need to save autorizer id here again, all you need is the mandateId
          request.authorizerID = authorizerID;
          request.mandateID = mandateID;
          request.isApproved = "active";
      let result = await request.save();
    }
      









    res.status(200).json({ message: "File uploaded successfully", data });

    
    
    }catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = batchUpload;