const amqp = require('amqplib');
const bankOneService = require('../bankOne.service');

const queueName = 'Transfer';


async function QueueTransfer(requestData, type) {
  try {
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();

    await channel.assertQueue(queueName, { durable: false });

    let transfer;
    if (type === 'inter-bank') {
      transfer = await bankOneService.doInterBankTransfer(requestData);
    } else {
      transfer = await bankOneService.doIntraBankTransfer(requestData);
    }

    const serializedData = JSON.stringify({transfer:transfer, transId:requestData._id});

    setTimeout(async () => {
      channel.sendToQueue(queueName, Buffer.from(serializedData));

      console.log('Request sent to queue');

      await channel.close();
      await connection.close();
    }, 5000);
  } catch (error) {
    console.error('Error sending request to queue:', error);
  }
}

module.exports = { QueueTransfer };
