const amqp = require('amqplib');

const queueName = 'Transfer';

async function QueueTransfer(requestData, type) {
  try {
    const connection = await amqp.connect('http://54.163.217.223:15672/');
    const channel = await connection.createChannel();

    await channel.assertQueue(queueName, { durable: false });

    const serializedData = JSON.stringify({requestData:requestData, type:type});

    setTimeout(async () => {
      channel.sendToQueue(queueName, Buffer.from(serializedData));

      console.log(`Request sent to queue: ${requestData._id} ${type}`);

      await channel.close();
      await connection.close();
    }, 5000);
  } catch (error) {
    console.error('Error sending request to queue:', error);
  }
}

module.exports = { QueueTransfer };
