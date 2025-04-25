var CronJob = require("cron").CronJob;
const path = require("path");

console.log("Cron job started");

require("dotenv").config();
const connectDB = require("../config/db");
const InitiateRequest = require("../model/initiateRequest.model");
const bankOneService = require("../services/bankOne.service");
const Account = require("../model/account");
const { acquireLock, releaseLock } = require("../services/dbLock.service");
const { sendSlackMessage } = require("../services/slack.service");

const withTimeout = (promise, timeoutMs) => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
};

const processTransferJob = new CronJob("*/5 * * * *", async () => {
  const now = new Date();
  const timestamp = now.toLocaleString("en-NG", { timeZone: "Africa/Lagos" });
  await sendSlackMessage("#gmfb-transfer-cron", ``, [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*GMFB Transfer job started at ${timestamp}*`,
      },
    },
    { type: "divider" },
  ]);

  const connection = await connectDB(process.env.MONGO_URI).catch((error) => {
    console.error("Error connecting to database:", error);
    return null;
  });

  if (!connection) {
    console.error("Database connection failed, exiting job.");
    sendSlackMessage(
      "#gmfb-transfer-cron",
      `*GMFB Transfer job failed to connect to database at ${timestamp}*`
    );
    return;
  }

  const notLocked = await acquireLock("transfer-job");

  // check if there's an existing lock
  if (!notLocked) {
    console.error("Failed to acquire lock, exiting job.");
    return;
  }


  const cursor = InitiateRequest.find({
    transferStatus: "queued",
  })
    .batchSize(50)
    .cursor();

  let processedCount = 0;
  let successCount = 0;
  let failedCount = 0;
  let disbursePendingCount = 0;

  for await (const transaction of cursor) {
    processedCount++;
    try {
      let payload = {};
      transaction.updatedAt = new Date();

      const account = await Account.findById(transaction.organizationId);
      if (!account) {
        console.error("Account not found for transaction:", transaction._id);
        transaction.transferStatus = "failed";
        transaction.meta = {
          ...(transaction.meta ?? {}),
          Status: "Failed",
          IsSuccessful: false,
          ResponseMessage: "Account not found",
          ResponseCode: "404",
          ResponseDescription: "Account not found",
          StatusDescription: "Failed",
          ResponseStatus: "Failed",
          IsInTernal: true,
        };
        failedCount++;
        await transaction.save();
        continue;
      }

      if (transaction.type === "inter-bank") {
        payload = {
          _id: transaction._id,
          Amount: transaction.amount * 100,
          Payer: account.accountName,
          PayerAccountNumber: transaction.payerAccountNumber,
          ReceiverAccountNumber: transaction.beneficiaryAccountNumber,
          ReceiverAccountType: transaction.beneficiaryAccountType,
          ReceiverBankCode: transaction.beneficiaryBankCode,
          ReceiverPhoneNumber: transaction.beneficiaryPhoneNumber,
          ReceiverName: transaction.beneficiaryBankName,
          ReceiverBVN: "",
          ReceiverKYC: "",
          TransactionReference: transaction.transactionReference,
          NIPSessionID: transaction.NIPSessionID,
          Token: process.env.AUTHTOKEN,
          Narration: transaction.narration,
        };
      } else if (transaction.type === "intra-bank") {
        payload = {
          _id: transaction._id,
          Amount: transaction.amount * 100,
          RetrievalReference: transaction.transactionReference,
          FromAccountNumber: transaction.payerAccountNumber,
          ToAccountNumber: transaction.beneficiaryAccountNumber,
          AuthenticationKey: process.env.AUTHTOKEN,
          Narration: transaction.narration,
        };
      } else {
        logger.error(
          `Unsupported transaction type: ${transaction.type} for transaction ${transaction._id}`
        );
        transaction.transferStatus = "failed";
        transaction.meta = {
          ...(transaction.meta ?? {}),
          Status: "Failed",
          IsSuccessful: false,
          ResponseMessage: "Unsupported transaction type",
          ResponseCode: "400",
          StatusDescription: "Failed",
          ResponseStatus: "Failed",
          IsInTernal: true,
        };
        await transaction.save();
        failedCount++;
        continue;
      }

      const apiResponse = await withTimeout(
        transaction.type === "inter-bank"
          ? bankOneService.doInterBankTransfer(payload)
          : bankOneService.doIntraBankTransfer(payload),
        30000 // 30 second timeout
      );

      if (apiResponse) {
        transaction.meta = {
          ...(transaction.meta ?? {}),
          ...apiResponse,
        };

        if (
          apiResponse.Status === "Successful" ||
          apiResponse.ResponseCode === "00"
        ) {
          transaction.transferStatus = "successful";
          successCount++;
        } else if (
          apiResponse.Status === "Pending" ||
          ["91", "06", "x06"].includes(apiResponse.ResponseCode)
        ) {
          transaction.transferStatus = "disburse pending";
          disbursePendingCount++;
        } else if (
          apiResponse.Status === "Awaiting confirmation status" ||
          ["08"].includes(apiResponse.ResponseCode)
        ) {
          transaction.transferStatus = "disburse pending";
          disbursePendingCount++;
        } else {
          transaction.transferStatus = "failed";
          failedCount++;
        }
        await transaction.save();
      } else {
        transaction.transferStatus = "disburse pending";
        await transaction.save();
      }
    } catch (error) {
      transaction.transferStatus = "disburse pending";
      transaction.meta = {
        ...(transaction.meta ?? {}),
        ResponseMessage: "Unexpected error occurred",
        ResponseStatus: "disburse pending",
        Status: "disburse pending",
        IsSuccessful: false,
        ResponseCode: "ERR_UNKNOWN",
        StatusDescription: "System error, retrying TSQ later",
        IsInTernal: true,
      };
      await transaction.save();
      console.error("Error processing transaction:", transaction?._id, error);
    }
  }

  console.info("Transfer job completed");

  await releaseLock("transfer-job");
  await connection.disconnect();

  await sendSlackMessage("#gmfb-transfer-cron", "", [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*GMFB Transfer job completed*`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `Successful: ${successCount}`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `Disburse Pending: ${disbursePendingCount}`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `Failed: ${failedCount}`,
      },
    },
    {
      type: "divider",
    },
  ]);
});

processTransferJob.start();
