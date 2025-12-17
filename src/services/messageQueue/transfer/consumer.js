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

async function consumeTransfer(type = 'bulk') {
  const queueName = `transfer_${type}_queue`;
  const dlqName = `transfer_${type}_dlq`;
  const routingKey = `transfer.${type}`;

  async function startConsumer() {
    let connection;
    let channel;

    try {
      connection = await amqp.connect(process.env.RABBIT_MQ_URL || 'amqp://localhost');
      channel = await connection.createChannel();

      await channel.assertExchange(EXCHANGE_NAME, EXCHANGE_TYPE, { durable: true });
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

      channel.consume(queueName, async (message) => {
        if (!message) return;

        try {
          const data = JSON.parse(message.content.toString());

          if (!Array.isArray(data) || data.length < 1) {
            logger.warn({ data }, 'Invalid data format');
            channel.nack(message, false, false);
            return;
          }

          switch (type) {
            case 'single':
              await processSingleTransfer(data[0]);
              break;
            case 'bulk':
              await processBulkTransfer(data);
              break;
            default:
              logger.warn({ type }, 'Unknown transfer type');
          }

          channel.ack(message);
        } catch (err) {
          logger.error({ err }, 'Error processing message');
          channel.nack(message, false, false); // dead-letter
        }
      }, { noAck: false });

      connection.on('error', async (err) => {
        logger.error({ err }, 'RabbitMQ connection error, retrying...');
        await reconnect();
      });
      connection.on('close', async () => {
        logger.warn('RabbitMQ connection closed, retrying...');
        await reconnect();
      });

      async function reconnect() {
        try {
          if (channel) await channel.close();
          if (connection) await connection.close();
        } catch (_) { }
        await new Promise(res => setTimeout(res, 5000)); // wait 5s
        startConsumer(); // restart consumer
      }

    } catch (err) {
      logger.error({ err }, 'Failed to start consumer, retrying in 5s...');
      setTimeout(startConsumer, 5000);
    }
  }

  startConsumer();
}


function getTransferStatus(status, responseCode) {

  if ((status === "Successful" && responseCode === "00") ||
    status === "SuccessfulButFeeNotTaken") {
    return "approved";
  }

  if (
    status === "Pending" ||
    ["06", "91", "X06", "08", "09"].includes(responseCode)
  ) {
    return "in progress";
  }

  if (status === "Reversed") {
    return "declined";
  }

  return "declined";
}


const processSingleTransfer = async (data) => {
  logger.info(`Processing single transfer`);
  const { originatingAccountName, transactionId } = data;

  const authToken = process.env.AUTHTOKEN
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
      transaction.status = APPROVAL_STATUS.IN_PROGRESS; // still in progress
      transaction.transferStatus = TRANSFER_STATUS.AWAITING_CONFIRMATION;
      return await transaction.save();
    }

    const transferstatus = getTransferStatus(
      result.Status,
      result.ResponseCode
    );
    transaction.status = transferstatus;
    transaction.transferStatus = transferstatus === "approved" ? TRANSFER_STATUS.SUCCESSFUL : TRANSFER_STATUS.FAILED;

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
      transaction.status = APPROVAL_STATUS.IN_PROGRESS;
      transaction.transferStatus = TRANSFER_STATUS.AWAITING_CONFIRMATION;

      return await transaction.save();
    }

    const transferstatus = getTransferStatus(
      result.Status,
      result.ResponseCode
    );
    transaction.status = transferstatus;
    transaction.transferStatus = transferstatus === "approved" ? TRANSFER_STATUS.SUCCESSFUL : TRANSFER_STATUS.FAILED;
    await transaction.save();
  }

  logger.info(`Processed single transfer: ${transactionId}`);
};

const processBulkTransfer = async (data) => {
  logger.info(`Processing ${data.length} bulk transfer`);
  const provider = await transferProviderService.getActiveProvider();

  const activeProvider = provider ? provider.slug : "bankone";

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
  const transferData = JSON.stringify(data, null, 2)
  eazypayProcessor(transferData);
};

const processBulkTransferWithPaystack = async (data) => {
  logger.info(`Processing ${data.length} bulk transfer with Paystack`);

  const authToken = process.env.AUTHTOKEN

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


    const bulkTransfers = [];
    let totalAmountToDebit = 0;

    // ---------------------------------------
    // BUILD PAYSTACK PAYLOAD + CALCULATE TOTAL
    // ---------------------------------------
    for (const transfer of interBankTransfers) {
      let recipient = await TransferReciepient.findOne({
        accountNumber: transfer.beneficiaryAccountNumber,
      });

      if (!recipient) {
        const newRecipient =
          await paystackService.createPaystackTransferReceipient({
            type: "nuban",
            account_number: transfer.beneficiaryAccountNumber,
            bank_code: transfer.beneficiaryBankCode,
            currency: "NGN",
          });

        recipient = await TransferReciepient.create({
          accountNumber: transfer.beneficiaryAccountNumber,
          reciepientCode: newRecipient.data.recipient_code,
        });
      }

      bulkTransfers.push({
        amount: transfer.amount * 100, // Paystack expects kobo
        reference: transfer.transactionReference,
        reason: transfer.narration,
        recipient: recipient.reciepientCode,
      });

      totalAmountToDebit += transfer.amount;
    }

    // ---------------------------------------
    // 1️⃣ CHECK BANKONE WITHDRAWABLE BALANCE
    // ---------------------------------------
    const payerAccountNo = interBankTransfers[0].payerAccountNumber;

    const accountResponse = await bankOneService.accountByAccountNo(
      payerAccountNo,
      authToken
    );

    console.log('account balance response:', accountResponse)

    if (
      !accountResponse ||
      !accountResponse?.WithdrawableBalance
    ) {
      throw new Error("Unable to retrieve account balance from BankOne");
    }

    const withdrawableBalance = Number(
      accountResponse.WithdrawableBalance.replace(/,/g, "")
    );

    // ---------------------------------------
    // 2️⃣ FAIL ALL TRANSFERS IF BALANCE IS LOW
    // ---------------------------------------
    if (withdrawableBalance < totalAmountToDebit) {
      logger.warn(
        `Insufficient balance. Available: ${withdrawableBalance}, Required: ${totalAmountToDebit}`
      );

      for (const transfer of interBankTransfers) {
        transfer.status = "declined";
        transfer.transferStatus = "failed";
        transfer.meta = {
          reason: "Insufficient account balance",
        };
        await transfer.save();
      }

      return; // ❌ STOP EXECUTION — DO NOT DEBIT OR CALL PAYSTACK
    }

    // ---------------------------------------
    // ✅ BALANCE IS SUFFICIENT
    // NEXT STEP: BANKONE DEBIT → PAYSTACK BULK
    // ---------------------------------------

    // ---------------------------------------
    // 3️⃣ DEBIT CUSTOMER ACCOUNT (BANKONE)
    // ---------------------------------------
    const debitResponse = await bankOneService.debitCustomerAccount({
      accountNumber: payerAccountNo,
      amount: totalAmountToDebit,
      authToken,
    });

    if (!debitResponse?.IsSuccessful) {
      logger.error("BankOne debit failed:", debitResponse);

      for (const transfer of interBankTransfers) {
        transfer.status = "declined";
        transfer.transferStatus = "failed";
        transfer.meta = {
          reason: "BankOne debit failed",
        };
        await transfer.save();
      }

      return; // ❌ STOP — DO NOT CALL PAYSTACK
    }

    logger.info("✅ BankOne debit successful");

    // ---------------------------------------
    // 4️⃣ PERFORM BULK TRANSFER TO PAYSTACK
    // ---------------------------------------
    const bulkTransferResponse = await paystackService.sendBulkTransferToPaystack(bulkTransfers);

    logger.info("Paystack bulk transfer response", bulkTransferResponse);

    if (!bulkTransferResponse?.status) {
      logger.error("❌ Paystack bulk transfer failed");

      for (const transfer of interBankTransfers) {
        transfer.status = "declined";
        transfer.transferStatus = "failed";
        transfer.meta = {
          reason: "Paystack bulk transfer failed",
        };
        await transfer.save();
      }

      return;
    }

    // ---------------------------------------
    // ✅ BULK TRANSFER INITIATED SUCCESSFULLY
    // NEXT STEP: VERIFY EACH PAYSTACK TRANSFER
    // ---------------------------------------

    // ---------------------------------------
    // 5️⃣ VERIFY PAYSTACK TRANSFERS
    // ---------------------------------------
    for (const psTransfer of bulkTransferResponse.data) {
      const { transfer_code, reference } = psTransfer;

      const transaction = interBankTransfers.find(
        (t) => t.transactionReference === reference
      );

      if (!transaction) continue;

      try {
        const statusResponse =
          await paystackService.verifyPaystackTransfer(transfer_code);

        const paystackStatus = statusResponse?.status;

        transaction.meta = {
          paystack: statusResponse,
        };

        if (paystackStatus === "success") {
          transaction.status = "approved";
          transaction.transferStatus = "successful";
        } else if (paystackStatus === "failed") {
          transaction.status = "declined";
          transaction.transferStatus = "failed";
        } else {
          transaction.status = "in progress";
          transaction.transferStatus = "pending";
        }

        await transaction.save();
      } catch (error) {
        transaction.status = "in progress";
        transaction.transferStatus = "pending";
        transaction.meta = {
          reason: "Unable to verify Paystack transfer status",
        };

        await transaction.save();
      }
    }

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
