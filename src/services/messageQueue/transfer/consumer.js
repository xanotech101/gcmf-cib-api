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
  try {
    console.log("📥 Paystack queue job received...s");
    logger.info(`📥 Processing Paystack bulk transfer | Total items: ${data.length}`);

    const authToken = process.env.AUTHTOKEN;
    const BATCH_SIZE = 100;

    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      const batch = data.slice(i, i + BATCH_SIZE);
      console.log(`📦 Processing Paystack batch ${i / BATCH_SIZE + 1}`);

      const transactions = await InitiateRequest.find({
        _id: { $in: batch.map((item) => item.transactionId) },
        type: "inter-bank",
      });

      if (transactions.length === 0) {
        console.warn("⚠️ No inter-bank transfers in this batch");
        continue;
      }

      const eligibleTransfers = [];
      const paystackPayload = [];

      for (const transfer of transactions) {
        console.log(`➡️ Processing transfer ${transfer._id} | Payer: ${transfer.payerAccountNumber} | Amount: ${transfer.amount}`);

        try {
          // -------------------------------
          // 1️⃣ CHECK BALANCE
          // -------------------------------
          const accountResponse = await bankOneService.accountByAccountNo(
            transfer.payerAccountNumber,
            authToken
          );

          console.log(`💰 Balance response for ${transfer.payerAccountNumber}:`, accountResponse);

          if (!accountResponse?.WithdrawableBalance) {
            throw new Error("Withdrawable balance not returned");
          }

          const withdrawableBalance = Number(accountResponse.WithdrawableBalance.replace(/,/g, ""));

          if (withdrawableBalance < transfer.amount) {
            console.warn(`❌ Insufficient funds | ${transfer.payerAccountNumber}`);

            transfer.transferStatus = TRANSFER_STATUS.FAILED;
            transfer.provider_type = "paystack";
            transfer.meta = {
              ...transfer.meta,
              reason: "Insufficient funds",
              payerAccountNumber: transfer.payerAccountNumber,
              withdrawableBalance,
            };
            await transfer.save();
            continue;
          }

          // -------------------------------
          // 2️⃣ DEBIT PAYER ACCOUNT
          // -------------------------------
          const debitResponse = await bankOneService.debitCustomerAccount({
            accountNumber: transfer.payerAccountNumber,
            amount: transfer.amount,
            authToken,
          });

          console.log(`🏦 Debit response for ${transfer.payerAccountNumber}:`, debitResponse);

          if (!debitResponse?.IsSuccessful) {
            console.error(`❌ BankOne debit failed for ${transfer.payerAccountNumber}`);

            transfer.transferStatus = TRANSFER_STATUS.FAILED;
            transfer.provider_type = "paystack";
            transfer.meta = {
              ...transfer.meta,
              reason: "BankOne debit failed",
              payerAccountNumber: transfer.payerAccountNumber,
              debitResponse,
            };
            await transfer.save();
            continue;
          }

          console.log(`✅ Debit successful for ${transfer.payerAccountNumber}`);

          // -------------------------------
          // 3️⃣ PREPARE PAYSTACK RECIPIENT
          // -------------------------------
          let recipient = await TransferReciepient.findOne({
            accountNumber: transfer.beneficiaryAccountNumber,
          });

          if (!recipient) {
            console.log(`👤 Creating Paystack recipient for ${transfer.beneficiaryAccountNumber}`);

            const newRecipient = await paystackService.createPaystackTransferReceipient({
              type: "nuban",
              account_number: transfer.beneficiaryAccountNumber,
              bank_code: transfer.beneficiaryBankCode,
              currency: "NGN",
            });

            console.log("📨 Paystack recipient creation response:", newRecipient);

            recipient = await TransferReciepient.create({
              accountNumber: transfer.beneficiaryAccountNumber,
              reciepientCode: newRecipient.data.recipient_code,
            });
          }

          // -------------------------------
          // 4️⃣ PREPARE UNIQUE PAYSTACK TRANSFER
          // -------------------------------
          const uniqueReference = `${transfer.transactionReference}-${Date.now()}`;

          paystackPayload.push({
            amount: Math.round(Number(transfer.amount) * 100),
            reference: uniqueReference,
            reason: transfer.narration,
            recipient: recipient.reciepientCode,
          });

          transfer.transferStatus = TRANSFER_STATUS.PROCESSING;
          transfer.provider_type = "paystack";
          transfer.meta = {
            ...transfer.meta,
            payerAccountNumber: transfer.payerAccountNumber,
            debitedAmount: transfer.amount,
            bankOneReference: debitResponse.Reference || null,
            paystackReference: uniqueReference,
          };
          await transfer.save();

          eligibleTransfers.push(transfer);
        } catch (err) {
          console.error(`🔥 Error processing transfer ${transfer._id}`, err);

          transfer.transferStatus = TRANSFER_STATUS.FAILED;
          transfer.provider_type = "paystack";
          transfer.meta = {
            ...transfer.meta,
            reason: err.message,
          };
          await transfer.save();
        }
      }

      // -------------------------------
      // 5️⃣ SEND ELIGIBLE TRANSFERS TO PAYSTACK
      // -------------------------------
      console.log(`📊 Eligible Paystack transfers: ${eligibleTransfers.length}`);

      if (paystackPayload.length === 0) {
        console.warn("⚠️ No eligible Paystack transfers in this batch");
        continue;
      }

      console.log(`🚀 Sending ${paystackPayload.length} transfers to Paystack`, paystackPayload);

      const bulkTransferResponse = await paystackService.sendBulkTransferToPaystack(paystackPayload);

      console.log("📨 Paystack bulk transfer response:", bulkTransferResponse);

      if (!bulkTransferResponse?.status) {
        console.error("❌ Paystack bulk transfer failed");

        for (const transfer of eligibleTransfers) {
          transfer.transferStatus = TRANSFER_STATUS.FAILED;
          transfer.provider_type = "paystack";
          transfer.meta = {
            ...transfer.meta,
            reason: "Paystack bulk transfer failed",
          };
          await transfer.save();
        }
        continue;
      }

      // -------------------------------
      // 6️⃣ VERIFY PAYSTACK TRANSFERS
      // -------------------------------
      for (const psTransfer of bulkTransferResponse.data) {
        const { transfer_code, reference } = psTransfer;

        const transaction = eligibleTransfers.find(
          (t) => t.meta.paystackReference === reference
        );

        if (!transaction) continue;

        try {
          console.log(`🔍 Verifying Paystack transfer ${reference}`);

          const statusResponse = await paystackService.verifyPaystackTransfer(transfer_code);

          console.log(`📨 Paystack verification response for ${reference}:`, statusResponse);

          const paystackStatus = statusResponse?.data?.status;

          transaction.meta = {
            ...transaction.meta,
            paystack: statusResponse,
          };

          if (paystackStatus === "success") {
            transaction.transferStatus = TRANSFER_STATUS.SUCCESSFUL;
          } else if (paystackStatus === "failed") {
            transaction.transferStatus = TRANSFER_STATUS.FAILED;
          } else {
            transaction.transferStatus = TRANSFER_STATUS.AWAITING_CONFIRMATION;
          }

          await transaction.save();
        } catch (error) {
          console.error(`⚠️ Unable to verify Paystack transfer ${reference}`, error);

          transaction.transferStatus = TRANSFER_STATUS.AWAITING_CONFIRMATION;
          transaction.meta = {
            ...transaction.meta,
            reason: "Unable to verify Paystack transfer",
          };
          await transaction.save();
        }
      }

      console.log(`🎉 Paystack batch ${i / BATCH_SIZE + 1} processing completed`);
    }
  } catch (error) {
    console.error("💥 Fatal Paystack bulk processing error", error);
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
