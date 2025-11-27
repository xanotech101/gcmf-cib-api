const { consumeTransferRequest } = require("./single-transfer/consumer");
const { consumeTransfer } = require("./transfer/consumer");

async function setup() {
    await consumeTransferRequest(),
        await consumeTransfer();
}

module.exports = { setup }