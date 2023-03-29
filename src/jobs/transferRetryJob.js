const cron = require("node-cron");
const InitiateRequest = require("../model/initiateRequest.model");
const bankOneService = require("../services/bankOne.service");

const authToken = process.env.AUTHTOKEN;

const transferRetryJob = cron.schedule("0 */4 * * *", async () => {
  console.info("Transfer Status Requery Job Started");
  try {
      const cursor = InitiateRequest.find({
        transferStatus: "pending",
        type: "interbank",
        retryCount: { $lt: 5 },
      }).cursor();
 
    cursor
      .on("data", async (transaction) => {
        try {
          const response = await bankOneService.transactionStatus({
            RetrievalReference: transaction.transactionReference,
            TransactionDate: new Date(), // formatt date to YYYYMMDD
            TransactionType: "INTERBANKTRANSFER",
            Amount: transaction.amount,
            Token: authToken,
          });

          // successful transfer
          if(response?.status === 'Successful' && response?.ResponseCode === "00") {
            transaction.transferStatus = "successful";
            await transaction.save();
          } else if (response?.status === 'Failed') {
            transaction.transferStatus = "failed";
            transaction.retryCount = transaction.retryCount + 1;
            await transaction.save();
          } else {
            transaction.retryCount = transaction.retryCount + 1;
            await transaction.save();
          }
        } catch (error) {
          console.info(error);
        }
      })
      .on("error", (error) => {
        console.log(error);
      })
      .on("close", () => {
        console.log("done");
      })
      .on("end", () => {
        console.log("end");
      });
  } catch (error) {
    console.log(error);
  }
});

module.exports = transferRetryJob;
