const mongoose = require("mongoose");

const bulkTransferProvider = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  }
});

module.exports = mongoose.model("bulkTransferProvider", bulkTransferProvider);
