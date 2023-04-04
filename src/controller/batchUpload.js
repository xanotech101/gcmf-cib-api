const multer = require("multer");
let csvToJson = require("convert-csv-to-json");
const fs = require("fs");
const excelToJson = require("convert-excel-to-json");
const Mandate = require("../model/mandate.model");
const User = require("../model/user.model");
const InitiateRequest = require("../model/initiateRequest.model");
const { validateInitiateRequestSchema } = require("../utils/utils");
const { sendEmail } = require("../utils/emailService");
const notificationService = require("../services/notification.service");
const AuditTrail = require("../model/auditTrail");
const bankOneService = require("../services/bankOne.service");
const emitter = require("../utils/emitters");
const authToken = process.env.AUTHTOKEN;


// Verify batchupload from bankOne
const VerifyBatchUpload = async (req, res) => {
  try {
    // Listen for the results from Kafka using the event emitter
    emitter.once('results', (results) => {
      // Send the results back to the client
     
      return res
        .status(200)
        .json( results );
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
};


const batchUpload = async () => {
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
        data = csvToJson.getJsonFromCsv(file.path);
        formattedData = formattedData.concat(data);
      } else {
        return res.status(400).json({
          message: "Invalid file type. Please upload a csv or excel file",
          status: "failed",
        });
      }

      fs.unlinkSync(file.path);
    }

    for (let i = 0; i < formattedData.length; i++) {
      const datum = formattedData[i];

      let mandate = await Mandate.find({})
        .populate({
          path: "authorisers",
          select: "firstName email",
        })
        .populate("verifier");

      for (let j = 0; j < mandate.length; j++) {
        let item = mandate[j];

        if (
          datum.amount >= item.minAmount &&
          datum.amount <= item.maxAmount
        ) {
          let authoriserDetails = item.authorisers ? item.authorisers : null;
          let verifier = item.verifier !== null ? item.verifier._id : null;
          let mandateID = item._id;

          for (let k = 0; k < authoriserDetails.length; k++) {

            let authoriser = authoriserDetails[k];

            let request = new InitiateRequest({
              customerName: datum.customerName,
              amount: datum.amount,
              bankName: datum.bankName,
              accountNumber: datum.accountNumber,
              accountName: datum.accountName,
              initiator: req.user._id,
              status: "pending",
              mandate: mandateID,
              verifier: verifier,
            });

            let result = await request.save();

            const subject = "Transaction Request Initiated";
            const message = `
                <h3>Transaction Request Initiated</h3>
                <p> Dear ${authoriser.firstName}. The below request was initiated for your authorization.</p>
                <p>TransactionID: ${result._id}</p>
                <p>Amount: ${result.amount}</p>
                <p>Kindly login to your account to review</p>
              `;

            await sendEmail(authoriser.email, subject, message);

            await notificationService.createNotifications([
              {
                title: "Transaction request Initiated",
                transaction: result._id,
                user: authoriser._id,
                message:
                  "A transaction request was initiated and is awaiting your approval",
              },
            ]);

            // create audit trail
            const user = await User.findById(req.user._id);
            let dt = new Date(new Date().toISOString());
            let date = dt.toString().slice(0, 15);
            let time = dt.toString().slice(16, 21);

            let audit = await AuditTrail.create({
              user: req.user._id,
              type: "transaction",
              transaction: result._id,
              message: `${user.firstName} ${user.lastName} initiated a transaction request on ${date} by ${time}`,
              organization: user.organization,
            });

            await audit.save();
          }
        }
      }
    }

    return res
      .status(200)
      .json({ message: "File uploaded successfully", formattedData });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
}
module.exports = { batchUpload, VerifyBatchUpload };
