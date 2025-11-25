// Unified publisher for single and bulk transfers using a topic exchange
const amqp = require('amqplib');
const logger = require('../../../utils/logger');

const EXCHANGE_NAME = 'transfer_exchange';
const EXCHANGE_TYPE = 'topic';

/**
 * Publishes a transfer message (single or bulk) to the topic exchange
 * @param {Object[]} data - Array of transfer objects. For both 'single' and 'bulk', always use an array:
 *   [{ originatingAccount: string, transactionId: string }]
 * @param {string} type - 'single' or 'bulk'
 */
async function publishTransfer(data, type = 'bulk') {
	const routingKey = `transfer.${type}`;
	const payload = Buffer.from(JSON.stringify(data));

	let connection;
	let channel;

	for (let attempt = 1; attempt <= 5; attempt++) { // Retry up to 5 times
		try {
			connection = await amqp.connect(process.env.RABBIT_MQ_URL || 'amqp://localhost');
			channel = await connection.createChannel();

			await channel.assertExchange(EXCHANGE_NAME, EXCHANGE_TYPE, { durable: true });

			channel.publish(EXCHANGE_NAME, routingKey, payload, { persistent: true }); // persistent!

			logger.info({ routingKey, data }, `Published transfer message`);
			await channel.close();
			await connection.close();
			return;
		} catch (err) {
			logger.error({ err, attempt }, `Failed to publish transfer, retrying...`);
			if (attempt === 5) throw err;
			await new Promise(res => setTimeout(res, 1000 * attempt)); // exponential backoff
		}
	}
}

module.exports = { publishTransfer };
