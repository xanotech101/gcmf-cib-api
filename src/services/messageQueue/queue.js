const { consumeTransferRequest } = require("./single-transfer/consumer");

async function setup() {
    await consumeTransferRequest();
}

module.exports = {setup}