// Unified consumer for single and bulk transfers using a topic exchange
const amqp = require('amqplib');
const logger = require('../../../utils/logger');
const transferProviderService = require('../../transferProvider.service');
const bankOneService = require('../../bankOne.service');

const EXCHANGE_NAME = 'transfer_exchange';
const EXCHANGE_TYPE = 'topic';



async function consumeTransfer(type = 'single') {

  const queueName = `transfer_${type}_queue`;
  const dlqName = `transfer_${type}_dlq`;
  const routingKey = `transfer.${type}`;
  
  try {
    const connection = await amqp.connect(process.env.RABBIT_MQ_URL || 'amqp://localhost');
    const channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE_NAME, EXCHANGE_TYPE, { durable: true });
   
    await channel.assertQueue(dlqName, { durable: true });
    await channel.assertQueue(queueName, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': '',
        'x-dead-letter-routing-key': dlqName,
      },
    });

    await channel.bindQueue(queueName, EXCHANGE_NAME, routingKey);
    channel.prefetch(1);

    logger.info(`Waiting for ${type} transfer messages in queue: ${queueName}`);

    channel.consume(queueName, async (message) => {
      if (message !== null) {
        try {
          const data = JSON.parse(message.content.toString());

          if(!Array.isArray(data) || data?.length < 1) {
            logger.warn({ data }, 'Invalid data format');
            channel.nack(message, false, false); // dead-letter
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
              logger.warn({ type }, 'Unknown transfer type received');
          }

          channel.ack(message);
        } catch (err) {
          logger.error({ err }, `Error processing ${type} transfer message`);
          channel.nack(message, false, false); // send to dead-letter queue
        }
      }
    }, { noAck: false });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      logger.info(`${type} transfer consumer shutting down (SIGINT)`);
      await channel.close();
      await connection.close();
      process.exit(0);
    });
    process.on('SIGTERM', async () => {
      logger.info(`${type} transfer consumer shutting down (SIGTERM)`);
      await channel.close();
      await connection.close();
      process.exit(0);
    });
  } catch (error) {
    logger.error({ err: error }, `Fatal error in ${type} transfer consumer`);
  }
}

module.exports = { consumeTransfer, processSingleTransfer, processBulkTransfer };


const processSingleTransfer = async (data) => {
  logger.info(`Processing single transfer`);
  const { originatingAccountName, transactionId } = data;
  const transaction = await InitiateRequest.findById(transactionId);
  
  if (!transaction) {
    logger.warn({ transactionId }, 'Transaction not found');
    return;
  }

  if(transaction.type === "inter-bank") {
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
  }

  if(transaction.type === "intra-bank") {
    const intraBankPayload = {
      Amount: transaction.amount * 100,
      RetrievalReference: transaction.transactionReference,
      FromAccountNumber: transaction.payerAccountNumber,
      ToAccountNumber: transaction.beneficiaryAccountNumber,
      AuthenticationKey: authToken,
      Narration: transaction.narration,
    };
    const result = await bankOneService.doIntraBankTransfer(intraBankPayload);
  }

  logger.info(`Processed single transfer: ${transactionId}`);
};

const processBulkTransfer = async (data) => {
  logger.info(`Processing ${data.length} bulk transfer`);
  const activeProvider = await transferProviderService.getActiveProviders()?.slug ?? "bankone";

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
  logger.info('Processing bulk transfer with EazyPay');
  // EazyPay specific processing logic
};

const processBulkTransferWithPaystack = async (data) => {
  logger.info(`Processing ${data.length} bulk transfer with Paystack`);
  // Paystack specific processing logic
};

const processBulkTransferWithBankOne = async (data) => {
  logger.info(`Processing ${data.length} bulk transfer with BankOne`);
  // BankOne specific processing logic
};

