const mongoose = require("mongoose");
const { toISOLocal } = require("../utils/utils");

const initiateRequestSchema = new mongoose.Schema(
  {
    mandate: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "Mandate",
    },
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
    batchVerificationID: String,
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
      default: 'pending'
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
      enum: ["inter-bank", "intra-bank"],
      type: String,
    },
    meta:{},
    time: Date,
    createdAt: { type: String, default: toISOLocal(new Date()) },
  updatedAt: { type: String, default: toISOLocal(new Date()) },
  }
);

module.exports = mongoose.model("InitiateRequest", initiateRequestSchema);
