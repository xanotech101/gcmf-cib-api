const mongoose = require("mongoose");
const { toISOLocal } = require("../utils/utils");
const { required } = require("joi");

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
    channel: String,
    userId: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "thirdparty",
    },
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
    organizationLabel: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "organzationLabel",
    },
    numberOfVerifiers: Number,
    transferStatus: {
      type: String,
      enum: ["disburse pending", "pending", "queued", "successful", "failed", "Awaiting confirmation status"],
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
    isProcessing: {
      type: Boolean,
      required: false,
      default: false,
      // "This field is used to check if the transaction is being processed",
    },
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
