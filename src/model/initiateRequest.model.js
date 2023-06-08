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
    numberOfVerifiers: Number,
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
        "awaiting authorization",
        "approved",
        "declined"
      ],
      default: "pending",
    },
    initiator: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "User",
    },
    verifiersAction: [
      {
        status: {
          type: String,
          enum: ["verified", "rejected"],
        },
        verifierID: {
          type: mongoose.Schema.Types.ObjectID,
          ref: "User",
        },
        reason: String,
      },
    ],
    authoriserAction: {
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
    createdAt: { type: String },
    updatedAt: { type: String },
  }
);

// Set the createdAt and updatedAt values before saving the document
initiateRequestSchema.pre("save", function (next) {
  const currentDate = toISOLocal();
  this.createdAt = currentDate;
  this.updatedAt = currentDate;
  next();
})


module.exports = mongoose.model("InitiateRequest", initiateRequestSchema);
