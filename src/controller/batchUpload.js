const Mandate = require("../model/mandate.model");
const User = require("../model/user.model");
const InitiateRequest = require("../model/initiateRequest.model");
const { getDateAndTime } = require("../utils/utils");
const { sendEmail } = require("../utils/emailService");
const notificationService = require("../services/notification.service");
const emitter = require("../utils/emitters");
const { userService, auditTrailService } = require("../services");
const uuid = require('uuid');
const Account = require("../model/account")


const VerifyBatchUpload = async (req, res) => {
  try {
    const unresolvedMandates = [];
    const unresolvedAccount = [];
    const mine = await User.findById(req.user._id);
    const batchId = uuid.v4().substring(0, 8);
    emitter.once('results', async (results) => {
      const notificationsToCreate = [];
      const emailsToSend = [];
      const auditTrailsToCreate = [];

      for (const item of results) {
        if (item.status === 'success') {
          switch (item.bankType) {
            case 'intra-bank':
              if (item.data.Name !== null && item.data.Name !== "" && item.data.Name !== "null") {
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
                  path: "verifiers",
                  select: "firstName lastName email phone",
                });

                if (!mandate) {
                  unresolvedMandates.push({
                    amount: item.amount,
                    accountNumber: item.accountNumber,
                    bankName: item.bankName,
                    bankCode: item.bankCode,
                    accountType: item.accountType,
                  });
                  continue;
                }

                const account = await Account.findById(mine.organizationId)

                request.mandate = mandate._id;
                request.initiator = req.user._id;
                request.narration = 'Transfer from ' + account?.accountName + ' to ' + item.data.Name + '\\\\' + item.narration


                // the organization label from the organizationId to add the request
                const getOrganizationLabel = await Account.findOne({ _id: mine.organizationId }).select('organizationLabel')
                if (getOrganizationLabel.organizationLabel !== null) {
                  request.organizationLabel = getOrganizationLabel.organizationLabel
                }

                const result = await request.save();

                for (const verifier of mandate.verifiers) {

                  if (!notificationsToCreate.some(notification => notification.user.equals(verifier._id))) {
                    const notification = {
                      title: "Transaction request Initiated",
                      transaction: result._id,
                      user: verifier._id,
                      message: "some transaction requests was initiated and is awaiting your approval",
                    };
                    notificationsToCreate.push(notification);

                    const subject = "Transaction Request Initiated";
                    const message = {
                      firstName: verifier.firstName,
                      message: `The below request was initiated for your verification.
                      TransactionID: ${result._id}    Amount: ${result.amount}  Kindly login to your account to review`,
                      year: new Date().getFullYear()
                    };
                    emailsToSend.push({ email: verifier.email, subject, template: 'transfer-request', message });
                  }
                }

                const user = await userService.getUserById(req.user._id);
                const { date, time } = getDateAndTime();
                const auditTrail = {
                  user: req.user._id,
                  type: "transaction",
                  transaction: result._id,
                  message: `${user.firstName} ${user.lastName} initiated some transaction requests on ${date} by ${time}`,
                  organization: mine.organizationId,
                };
                if (!auditTrailsToCreate.some(trail => trail.user === auditTrail.user)) {
                  auditTrailsToCreate.push(auditTrail);
                }

              } else {
                unresolvedAccount.push(item);
              }
              break;
            case 'inter-bank':
              if (item.data.Name !== null && item.data.Name !== "" && item.data.Name !== "null") {
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
                  path: "verifiers",
                  select: "firstName lastName email phone",
                });

                if (!mandate) {
                  unresolvedMandates.push({
                    amount: item.amount,
                    accountNumber: item.accountNumber,
                    bankName: item.bankName,
                    bankCode: item.bankCode,
                    accountType: item.accountType,
                    error: "No mandate found for this amount"
                  });
                  continue;
                }

                const account = await Account.findById(mine.organizationId)

                request.mandate = mandate._id;
                request.initiator = req.user._id;
                request.narration = 'Transfer from ' + account?.accountName + ' to ' + item.data.Name + '\\\\' + item.narration

                 // the organization label from the organizationId to add the request
                 const getOrganizationLabel = await Account.findOne({ _id: mine.organizationId }).select('organizationLabel')
                 if (getOrganizationLabel.organizationLabel !== null) {
                   request.organizationLabel = getOrganizationLabel.organizationLabel
                 }
                const result = await request.save();

                for (const verifier of mandate.verifiers) {
                  if (!notificationsToCreate.some(notification => notification.user.equals(verifier._id))) {
                    const notification = {
                      title: "Transaction request Initiated",
                      transaction: result._id,
                      user: verifier._id,
                      message: "some transaction requests was initiated and is awaiting your approval",
                    };
                    notificationsToCreate.push(notification);

                    const subject = "Transaction Request Initiated";
                    const message = {
                      firstName: verifier.firstName,
                      message: `The below request was initiated for your verification.
                      TransactionID: ${result._id}    Amount: ${result.amount}  Kindly login to your account to review`,
                      year: new Date().getFullYear()
                    };
                    emailsToSend.push({ email: verifier.email, subject, template: 'transfer-request', message });
                  }
                }

                const user = await userService.getUserById(req.user._id);

                const { date, time } = getDateAndTime();
                const auditTrail = {
                  user: req.user._id,
                  type: "transaction",
                  transaction: result._id,
                  message: `${user.firstName} ${user.lastName} initiated some transaction requests on ${date} by ${time}`,
                  organization: mine.organizationId,
                };
                if (!auditTrailsToCreate.some(trail => trail.user === auditTrail.user)) {
                  auditTrailsToCreate.push(auditTrail);
                }

              } else {
                unresolvedAccount.push(item);
              }
              break;
            default:
              unresolvedAccount.push(item);
          }
        } else {
          unresolvedAccount.push(item);
        }
      }

      // Create notifications
      for (const notification of notificationsToCreate) {
        await notificationService.createNotifications(notification);
      }

      // Send emails
      for (const emailData of emailsToSend) {
        await sendEmail(emailData.email, emailData.subject, emailData.template, emailData.message);
      }


      // Create audit trails
      for (const audit of auditTrailsToCreate) {
        await auditTrailService.createAuditTrail(audit);
      }


      return res.status(200).json({
        message: "Transactions initiated successfully",
        status: "success",
        data: { unresolvedMandates, unresolvedAccount }
      });
    });
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
