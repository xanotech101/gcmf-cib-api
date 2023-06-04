const multer = require("multer");
let csvToJson = require("convert-csv-to-json");
const fs = require("fs");
const excelToJson = require("convert-excel-to-json");
const Mandate = require("../model/mandate.model");
const User = require("../model/user.model");
const InitiateRequest = require("../model/initiateRequest.model");
const { validateInitiateRequestSchema, getDateAndTime } = require("../utils/utils");
const { sendEmail } = require("../utils/emailService");
const notificationService = require("../services/notification.service");
const AuditTrail = require("../model/auditTrail");
const bankOneService = require("../services/bankOne.service");
const emitter = require("../utils/emitters");
const { result } = require("lodash");
const { default: mongoose } = require("mongoose");
const { userService, auditTrailService } = require("../services");
const uuid = require('uuid');
const authToken = process.env.AUTHTOKEN;


// Verify batchupload from bankOne
const VerifyBatchUpload = async (req, res) => {
  try {
    let counter = 0; // Initialize a unique counter
    const unresolvedMandates = [];
    const unresolvedAccount = [];
    const mine = await User.findById(req.user._id);
    const batchId = uuid.v4().substring(0, 8);
    emitter.once('results', async (results) => {
      console.log(results)
      return
      for (const item of results) {
        if (item.status === 'success') {
          
          counter++; // Increment the counter for the next iteration

          const request = new InitiateRequest({
            NIPSessionID: item.data.SessionID,
            amount: item.amount,
            payerAccountNumber: item.payerAccountNumber,
            narration: item.narration,
            beneficiaryAccountName: item.data.Name,
            beneficiaryAccountNumber: item.accountNumber,
            beneficiaryAccountType: item.accountType,
            beneficiaryBVN: item.data.BVN,
            beneficiaryBankCode: item.bankCode,
            beneficiaryBankName: item.bankName,
            beneficiaryKYC: item.data.KYC,
            organizationId: mine.organizationId.toString(),
            transactionReference: generateRandomCode(),
            type: item.bankType,
            batchId: batchId
          });

          const mandate = await Mandate.findOne({
            organizationId: mine.organizationId.toString(),
            minAmount: { $lte: request.amount },
            maxAmount: { $gte: request.amount },
          }).populate({
            path: "authorisers",
            select: "firstName lastName email phone",
          });

          if (!mandate) {
            unresolvedMandates.push({
              amount: item.amount,
              accountNumber: item.accountNumber,
              bankName: item.bankName,
              error: "No mandate found for this amount"
            });
            continue;
          }

          request.mandate = mandate._id;
          request.initiator = req.user._id;

          const result = await request.save();
          const notificationsToCreate = [];

          for (const authoriser of mandate.authorisers) {
            const notification = {
              title: "Transaction request Initiated",
              transaction: result._id,
              user: authoriser._id,
              message:
                "A transaction request was initiated and is awaiting your approval",
            };

            notificationsToCreate.push(notification);

            //Mail notification
            const subject = "Transaction Request Initiated";


            const message = {
              firstName: authoriser.firstName,
              message: `The below request was initiated for your authorization.
          TransactionID: ${result._id}    Amount: ${result.amount}  Kindly login to your account to review
         `,
              year: new Date().getFullYear()
            }

            await sendEmail(authoriser.email, subject, 'transfer-request', message);
          }

          // send out notifications
          await notificationService.createNotifications(notificationsToCreate);

          // create audit trail
          const user = await userService.getUserById(req.user._id);
          const { date, time } = getDateAndTime();
          await auditTrailService.createAuditTrail({
            user: req.user._id,
            type: "transaction",
            transaction: result._id,
            message: `${user.firstName} ${user.lastName} initiated a transaction request on ${date} by ${time}`,
            organization: mine.organizationId,
          });
        } else {
          unresolvedAccount.push(item);
        }
      }

      return res.status(200).json({
        message: "Transactions initiated successfully",
        status: "success",
        data: { unresolvedMandates, unresolvedAccount }
      })
    })
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
};

function generateRandomCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 12; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters[randomIndex];
  }
  return code;
}

module.exports = { VerifyBatchUpload };
