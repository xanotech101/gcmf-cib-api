// Unified consumer for single and bulk transfers using a topic exchange
const amqp = require("amqplib");
const logger = require("../../../utils/logger");
const transferProviderService = require("../../transferProvider.service");
const bankOneService = require("../../bankOne.service");
const InitiateRequest = require("../../../model/initiateRequest.model");
const { TRANSFER_STATUS } = require("../../../model/initiateRequest.model");
const { eazypayProcessor } = require("./easypay.process");
const TransferReciepient = require("../../../model/transferReciepient");
const paystackService = require("../../paystack.service");

const EXCHANGE_NAME = "transfer_exchange";
const EXCHANGE_TYPE = "topic";

async function consumeTransfer(type = "single") {
  const queueName = `transfer_${type}_queue`;
  const dlqName = `transfer_${type}_dlq`;
  const routingKey = `transfer.${type}`;

  try {
    const connection = await amqp.connect(
      process.env.RABBIT_MQ_URL || "amqp://localhost"
    );
    const channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE_NAME, EXCHANGE_TYPE, {
      durable: true,
    });

    await channel.assertQueue(dlqName, { durable: true });
    await channel.assertQueue(queueName, {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": "",
        "x-dead-letter-routing-key": dlqName,
      },
    });

    await channel.bindQueue(queueName, EXCHANGE_NAME, routingKey);
    channel.prefetch(1);

    logger.info(`Waiting for ${type} transfer messages in queue: ${queueName}`);

    channel.consume(
      queueName,
      async (message) => {
        if (message !== null) {
          try {
            const data = JSON.parse(message.content.toString());

            if (!Array.isArray(data) || data?.length < 1) {
              logger.warn({ data }, "Invalid data format");
              channel.nack(message, false, false); // dead-letter
              return;
            }

            switch (type) {
              case "single":
                await processSingleTransfer(data[0]);
                break;
              case "bulk":
                await processBulkTransfer(data);
                break;
              default:
                logger.warn({ type }, "Unknown transfer type received");
            }

            channel.ack(message);
          } catch (err) {
            logger.error({ err }, `Error processing ${type} transfer message`);
            channel.nack(message, false, false); // send to dead-letter queue
          }
        }
      },
      { noAck: false }
    );

    // Graceful shutdown
    process.on("SIGINT", async () => {
      logger.info(`${type} transfer consumer shutting down (SIGINT)`);
      await channel.close();
      await connection.close();
      process.exit(0);
    });
    process.on("SIGTERM", async () => {
      logger.info(`${type} transfer consumer shutting down (SIGTERM)`);
      await channel.close();
      await connection.close();
      process.exit(0);
    });
  } catch (error) {
    logger.error({ err: error }, `Fatal error in ${type} transfer consumer`);
  }
}

function getTransferStatus(status, responseCode) {
  if (status === "Successful" && responseCode === "00") {
    return "successful";
  }

  if (status === "SuccessfulButFeeNotTaken") {
    return "successful";
  }

  if (
    status === "Pending" ||
    ["06", "91", "X06", "08", "09"].includes(responseCode)
  ) {
    return "awaiting confirmation";
  }

  if (status === "Reversed") {
    return "reversed";
  }
  return "failed";
}

const processSingleTransfer = async (data) => {
  logger.info(`Processing single transfer`);
  const { originatingAccountName, transactionId } = data;
  const transaction = await InitiateRequest.findOneAndUpdate(
    { _id: transactionId },
    { $set: { status: "processing" } },
    { new: true }
  );

  if (!transaction) {
    logger.warn({ transactionId }, "Transaction not found");
    return;
  }

  if (transaction.type === "inter-bank") {
    const interBankPayload = {
      Amount: transaction.amount * 100,
      Payer: originatingAccountName,
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
      Token: authToken,
      Narration: transaction.narration,
    };
    const result = await bankOneService.doInterBankTransfer(interBankPayload);

    if (result.isSuccessful === false) {
      transaction.status = TRANSFER_STATUS.AWAITING_CONFIRMATION;
      return await transaction.save();
    }

    const transferstatus = getTransferStatus(
      result.Status,
      result.ResponseCode
    );
    transaction.status = transferstatus;
  }

  if (transaction.type === "intra-bank") {
    const intraBankPayload = {
      Amount: transaction.amount * 100,
      RetrievalReference: transaction.transactionReference,
      FromAccountNumber: transaction.payerAccountNumber,
      ToAccountNumber: transaction.beneficiaryAccountNumber,
      AuthenticationKey: authToken,
      Narration: transaction.narration,
    };
    const result = await bankOneService.doIntraBankTransfer(intraBankPayload);

    if (result.isSuccessful === false) {
      transaction.status = TRANSFER_STATUS.AWAITING_CONFIRMATION;
      return await transaction.save();
    }

    const transferstatus = getTransferStatus(
      result.Status,
      result.ResponseCode
    );
    transaction.status = transferstatus;

    await transaction.save();
  }

  logger.info(`Processed single transfer: ${transactionId}`);
};

const processBulkTransfer = async (data) => {
  logger.info(`Processing ${data.length} bulk transfer`);
  const activeProvider =
    (await transferProviderService.getActiveProvider()?.slug) ?? "bankone";

  switch (activeProvider) {
    case "eazypay":
      await processBulkTransferWithEazyPay(data);
      break;
    case "paystack":
      await processBulkTransferWithPaystack(data);
      break;
    default:
      await processBulkTransferWithBankOne(data);
      break;
  }
};

const processBulkTransferWithEazyPay = async (data) => {
  logger.info("Processing bulk transfer with EazyPay");
  eazypayProcessor(data);
};

const processBulkTransferWithPaystack = async (data) => {
  logger.info(`Processing ${data.length} bulk transfer with Paystack`);

  const BATCH_SIZE = 100;
  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE);
    logger.info(`Processing Paystack batch: ${i / BATCH_SIZE + 1}`);

    const transactions = await InitiateRequest.find({
      _id: { $in: batch.map((item) => item.transactionId) },
    });

    const intraBankTransfers = [];
    const interBankTransfers = [];

    transactions.forEach((transaction) => {
      if (transaction.type === "intra-bank") {
        intraBankTransfers.push(transaction);
      } else if (transaction.type === "inter-bank") {
        interBankTransfers.push(transaction);
      }
    });

    if (intraBankTransfers.length > 0) {
      for (const transfer of intraBankTransfers) {
        await processSingleTransfer({
          originatingAccountName: transfer.payerAccountName,
          transactionId: transfer._id,
        });
        await new Promise((resolve) => setTimeout(resolve, 5000)); // 5 seconds delay
      }
    }

    const preparedTransactions = [];

    for (const transfer of interBankTransfers) {
      const recipient = await TransferReciepient.findOne({
        accountNumber: transfer.beneficiaryAccountNumber,
      });

      if (!recipient) {
        const newRecipient =
          await paystackService.createPaystackTransferReceipient({
            type: "nuban",
            account_number: transfer.beneficiaryAccountNumber,
            bank_code: transfer.beneficiaryBankCode,
            ncurrency: "NGN"
          });
        console.log(newRecipient, "New Paystack recipient created");
      } else {
        // send to GMFB, when successful, add to preparedTransactions
        preparedTransactions.push({
          amount: transfer.amount * 100,
          reference: transfer.transactionReference,
          reason: transfer.narration,
          recipient: recipient.reciepientCode,
        });
      }
    }
    // Optionally: process preparedTransactions here if needed
  }
};

const processBulkTransferWithBankOne = async (data) => {
  logger.info(`Processing ${data.length} bulk transfer with BankOne`);
};

module.exports = {
  consumeTransfer,
  processSingleTransfer,
  processBulkTransfer,
};
