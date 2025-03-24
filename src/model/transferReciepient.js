const mongoose = require("mongoose");

const transferReceipientSchema = new mongoose.Schema(
  {
    accountNumber: {
      type: String,
    },
    reciepientCode: {
      type: String,
    },
    provider: {
      type: String,
      enum: ["paystack"],
      default: "paystack"
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("TransferReciepient", transferReceipientSchema);
