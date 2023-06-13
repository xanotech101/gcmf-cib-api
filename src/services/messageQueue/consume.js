const amqp = require('amqplib');
const InitiateRequest = require("../../model/initiateRequest.model");
const bankOneService = require('../bankOne.service');
const queueName = 'Transfer';

async function consumeTransferRequest() {
    try {
        const connection = await amqp.connect('amqp://localhost');
        const channel = await connection.createChannel();

        await channel.assertQueue(queueName, { durable: false });

        channel.consume(queueName, async (message) => {
            if (message !== null) {

                const serializedMessage = message.content.toString();
                try {
                    const { requestData, type } = JSON.parse(serializedMessage);

                    let transfer;
                    if (type === 'inter-bank') {
                        transfer = await bankOneService.doInterBankTransfer(requestData);
                    } else {
                        transfer = await bankOneService.doIntraBankTransfer(requestData);
                    }
                    if (transfer) {
                        const request = await InitiateRequest.findById(requestData._id)
                        if (transfer?.Status === "Successful" || transfer?.ResponseCode === "00") {
                            request.transferStatus = "successful";
                            request.meta = transfer;
                            await request.save();
                        } else if (
                            transfer?.Status === "Pending" ||
                            ["91", "06"].includes(transfer?.ResponseCode)
                        ) {
                            request.meta = transfer;
                            request.updatedAt = new Date();
                            await request.save();
                        } else {
                            request.meta = transfer;
                            request.updatedAt = new Date();
                            request.transferStatus = "failed";
                            await request.save();
                        }
                    }
                    console.log(`resolved transfer ${requestData._id} ${type}`)
                    channel.ack(message);
                } catch (error) {
                    console.error('Response processing error:', error);
                }
            }
        }, { noAck: false });

        console.log('Waiting for responses...');
    } catch (error) {
        console.error(error);
    }
}

module.exports = { consumeTransferRequest }
