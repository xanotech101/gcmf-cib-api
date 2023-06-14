const { consumeTransferRequest } = require("./consume");

async function setup() {
    // Consume messages from the queue
    await consumeTransferRequest();
}

module.exports = {setup}