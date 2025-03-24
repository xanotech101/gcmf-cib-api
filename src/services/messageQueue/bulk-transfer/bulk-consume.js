const amqp = require("amqplib");
const { bulkTransferQueueName } = require("../config");
const mongoose = require("mongoose");
const { InitiateRequest } = require("../../../model/initiateRequest.model");
const bankOneService = require("../../bankOne.service");
const paystackService = require("../../paystack.service");
const TransferReciepient = require("../../../model/transferReciepient");

const authToken = process.env.AUTHTOKEN;

async function consumeBulkTransferRequest() {
  try {
    //todo: create a transfer request here also, there is no initiator also no approval needed
    
    const connection = await amqp.connect(
      process.env.RABBIT_MQ_URL || "amqp://localhost"
    );

    const channel = await connection.createChannel();
    await channel.assertQueue(bulkTransferQueueName, { durable: false });

    const unprocessedTransactions = [];
    const transactionsToProcess = [];
    const collectionAccount = process.env.BULK_TRANSFER_COLLECTION_ACCOUNT;

    channel.consume(
      bulkTransferQueueName,
      async (message) => {
        if (message !== null) {
          const serializedMessage = message.content.toString();
          try {
            const data = JSON.parse(serializedMessage)?.data ?? {};
            const {
              transferRequests,
              batchId,
              provider,
              originatingAccountNumber,
              user,
            } = data;

            for (const request of transferRequests) {
              const accountDetails = await paystackService.resolveAccount({
                account_number: request.destinationAccountNumber,
                bank_code: request.destinationBankCode,
              });

              if (!accountDetails) {
                unprocessedTransactions.push({
                  ...request,
                  message: "Unable to resolve account details",
                });
                continue;
              }

              const reference = mongoose.Types.ObjectId().toString().substr(0, 12);
              const transferResponse = await bankOneService.doIntraBankTransfer(
                {
                  Amount: Number(request.amount) * 100,
                  RetrievalReference: reference,
                  Narration: `Transfer to ${request.destinationAccountNumber}`,
                  AuthenticationKey: authToken,
                  FromAccountNumber: request.originatorAccountNumber,
                  ToAccountNumber: collectionAccount,
                }
              ).catch((error) => {
                console.error("🚀 ~ transferResponse error:", error);
                return null;
              });

              console.log("🚀 ~ transferResponse:", transferResponse);


              if(transferResponse.IsSuccessful === true && transferResponse.ResponseCode === "06") {
                const transferRecipient = await TransferReciepient.findOne({
                  accountNumber: request.destinationAccountNumber,
                  provider: "paystack",
                });

                if(!transferRecipient) {
                  const paystackRecipient = await paystackService.createTransferReciepient({
                    account_number: request.destinationAccountNumber,
                    bank_code: request.bankCode,
                    name: accountDetails.account_name,
                  });
                  
                  if(!paystackRecipient) {
                    unprocessedTransactions.push({
                      ...request,
                      message: "Unable to create transfer reciepient on paystack",
                    });
                    continue;
                  }

                  // create the transfer reciepient in our database
                  await TransferReciepient.create({
                    accountNumber: request.destinationAccountNumber,
                    reciepientCode: paystackRecipient.recipient_code,
                    provider: "paystack",
                  });

                  // push to the bulk transfer array to be sent to paystack
                  transactionsToProcess.push({
                    amount: request.amount * 100,
                    reference,
                    recipient: transferRecipient.recipient_code,
                  });
                } else {
                  transactionsToProcess.push({
                    amount: request.amount * 100,
                    reference,
                    recipient: transferRecipient.reciepientCode,
                  });
                }
                console.log("🚀 ~ transactionsToProcess:", transactionsToProcess);
              } else {
                unprocessedTransactions.push({
                  ...request,
                  message: "Transfer from originating account to collection account failed",
                });
              }
            }
            console.log("🚀 ~ transactionsToProcess:", transactionsToProcess)
            console.log("🚀 ~ unprocessedTransactions:", unprocessedTransactions);
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
