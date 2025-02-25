const amqp = require("amqplib");
const { bulkTransferQueueName } = require("../config");
const mongoose = require("mongoose");
const { InitiateRequest } = require("../../../model/initiateRequest.model");
const bankOneService = require("../../bankOne.service");
const { TransferReciepient } = ("../../../model/transferReciepient")

const authToken = process.env.AUTHTOKEN;

async function consumeBulkTransferRequest() {
  try {
    const connection = await amqp.connect(
      process.env.RABBIT_MQ_URL || "amqp://localhost"
    );
    const channel = await connection.createChannel();

    await channel.assertQueue(bulkTransferQueueName, { durable: false });

    const unprocessedTransactions = [];
    const collectionAccount = process.env.BULK_TRANSFER_COLLECTION_ACCOUNT;

    channel.consume(
      bulkTransferQueueName,
      async (message) => {
        if (message !== null) {
          const serializedMessage = message.content.toString();
          try {
            const {
              transferRequest,
              batchId,
              provider,
              originatingAccountNumber,
              user,
            } = JSON.parse(serializedMessage);

            for (const request of transferRequest) {
              const accountDetails = await paystackService.resolveAccount({
                account_number: transferRequest.destinationAccountNumber,
                bank_code: transferRequest.bankCode,
              });

              if (!accountDetails) {
                unprocessedTransactions.push({
                  ...transferRequest,
                  message: "Unable to resolve account details",
                });
                continue;
              }

              const transferResponse =
                await bankOneService.doIntraBankTransfer({
                  Amount: Number(request.amount) * 100,
                  RetrievalReference: mongoose.Types.ObjectId()
                    .toString()
                    .substr(0, 12),
                  Narration: `Transfer to ${request.destinationAccountNumber}`,
                  AuthenticationKey: authToken,
                  FromAccountNumber: originatingAccountNumber,
                  ToAccountNumber: collectionAccount,
                });

                if(!transferResponse) {
                  unprocessedTransactions.push({
                    ...transferRequest,
                    message: "Transfer failed",
                  });
                  continue;
                }

                if(transferResponse.Status === "Successful" && transferResponse.ResponseCode === "00") {
                  const transferReciepient = await TransferReciepient.findOne({
                    accountNumber: request.destinationAccountNumber,
                  });

                  // call paystack to create a transfer receipent for this account number
                }

              // send money using paystack to the destination account number
            }

            channel.ack(message);
          } catch (error) {
            console.error("Response processing error:", error);
          }
        }
      },
      { noAck: false }
    );

    console.log("Waiting for responses...");
  } catch (error) {
    console.error(error);
  }
}

module.exports = { consumeBulkTransferRequest };
