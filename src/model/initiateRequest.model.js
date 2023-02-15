const mongoose = require("mongoose");

const initiateRequestSchema = new mongoose.Schema(
  {
    mandate: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "Mandate",
    },
    customerName: String,
    amount: Number,
    bankName: String,
    accountNumber: String,
    accountName: String,
    transferStatus: String,
    initiator: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "User",
    },
    isApproved: {
      type: String,
      enum: ["active", "approved", "declined"],
      default: "active",
    },
    approval: [
      {
         authorizerID: String,
      }
    ],
    decline: [
      {
        authorizerID: String,
        reason: String,
      },
    ],
    time: Date,
  },
  {
    timestamps: { type: Date, required: true, unique: true },
  }
);

module.exports = mongoose.model("InitiateRequest", initiateRequestSchema);
