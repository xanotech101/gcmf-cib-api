const mongoose = require("mongoose");

const initiateRequestSchema = new mongoose.Schema(
  {
    mandate: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "Mandate",
    },
    fullName: String,
    amount: Number,
    retryCount: {
      type: Number,
      default: 0,
    },
    payerAccountNumber: String,
    beneficiaryBankCode: String,
    beneficiaryAccountNumber: String,
    beneficiaryBankName: String,
    beneficiaryAccountName: String,
    beneficiaryPhoneNumber: String,
    narration: String,
    beneficiaryAccountType: {
      type: String,
      enum: ["savings", "current"],
    },
    beneficiaryKYC: String,
    beneficiaryBVN: String,
    NIPSessionID: String,
    transactionReference: String,
    batchId: String,
    organizationId: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "Account",
    },
    numberOfAuthorisers: Number,
    transferStatus: {
      type: String,
      enum: ["disburse pending", "pending", "successful", "failed"],
    },
    status: {
      type: String,
      enum: [
        "pending",
        "in progress",
        "awaiting verification",
        "approved",
        "declined"
      ],
      default: "pending",
    },
    initiator: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "User",
    },
    authorisersAction: [
      {
        status: {
          type: String,
          enum: ["authorised", "rejected"],
        },
        authoriserID: {
          type: mongoose.Schema.Types.ObjectID,
          ref: "User",
        },
        reason: String,
      },
    ],
    verifierAction: {
      status: {
        type: String,
        enum: ["approved", "declined"],
      },
      reason: String,
    },
    type: {
      enum: ["GMFB", "OTHERS"],
      type: String,
    },
    time: Date,
    createdAt: {
      type: Date,
      default: Date.now()
    },
    updatedAt: {
      type: Date,
      default: Date.now()
    },
  }
);

module.exports = mongoose.model("InitiateRequest", initiateRequestSchema);
