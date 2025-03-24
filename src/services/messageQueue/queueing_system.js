const { consumeTransferRequest } = require("./single-transfer/consume");
const {consumeBulkTransferRequest} = require("./bulk-transfer/bulk-consume");

async function consumeQueue() {
    // Consume messages from the queue
    await consumeTransferRequest();
    await consumeBulkTransferRequest();
}

module.exports = { consumeQueue };