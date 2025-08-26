// Unified publisher for single and bulk transfers using a topic exchange
const amqp = require('amqplib');
const logger = require('../../../utils/logger');

const EXCHANGE_NAME = 'transfer_exchange';
const EXCHANGE_TYPE = 'topic';

/**
 * Publishes a transfer message (single or bulk) to the topic exchange
 * @param {Object[]} data - Array of transfer objects. For both 'single' and 'bulk', always use an array:
 *   [{ originatingAccountName: string, transactionId: string }]
 * @param {string} type - 'single' or 'bulk'
 */
async function publishTransfer(data, type = 'single') {
	const routingKey = `transfer.${type}`;
	try {
		const connection = await amqp.connect(process.env.RABBIT_MQ_URL || 'amqp://localhost');
		const channel = await connection.createChannel();
		await channel.assertExchange(EXCHANGE_NAME, EXCHANGE_TYPE, { durable: true });

		const serializedData = JSON.stringify(data);
		channel.publish(EXCHANGE_NAME, routingKey, Buffer.from(serializedData));
		logger.info({ routingKey, data }, `Published transfer message to ${EXCHANGE_NAME}`);

		await channel.close();
		await connection.close();
	} catch (error) {
		logger.error({ err: error }, 'Error publishing transfer message');
	}
}

module.exports = { publishTransfer };
