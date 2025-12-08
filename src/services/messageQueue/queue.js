const { consumeTransferRequest } = require("./single-transfer/consumer");
const { consumeTransfer } = require("./transfer/consumer");

async function setup() {
    await consumeTransferRequest(),
        await consumeTransfer();
    await consumeTransfer('single')
}

module.exports = { setup }