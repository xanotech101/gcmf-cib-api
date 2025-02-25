const amqp = require('amqplib');
const { bulkTransferQueueName } = require("../config");

async function bulkTransferQueue(data) {
  try {
    const connection = await amqp.connect(process.env.RABBIT_MQ_URL || 'amqp://localhost');
    const channel = await connection.createChannel();

    await channel.assertQueue(bulkTransferQueueName, { durable: false });
    const serializedData = JSON.stringify({ data });
                          
    setTimeout(async () => {
      channel.sendToQueue(bulkTransferQueueName, Buffer.from(serializedData));
      await channel.close();
      await connection.close();
    }, 5000);
  } catch (error) {
    console.error('Error sending request to queue:', error);
  }
}

module.exports = { bulkTransferQueue };
