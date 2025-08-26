const mongoose = require("mongoose");
const { toISOLocal } = require("../utils/utils");


module.exports.TRANSFER_STATUS = Object.freeze({
  PENDING: "pending",
  QUEUED: "queued",
  PROCESSING: "processing",
  SUCCESSFUL: "successful",
  FAILED: "failed",
  AWAITING_CONFIRMATION: "Awaiting confirmation",
  REVERSED: "reversed",
});

module.exports.APPROVAL_STATUS = Object.freeze({
  PENDING: "pending",
  IN_PROGRESS: "in progress",
  APPROVED: "approved",
  DECLINED: "declined",
});

const initiateRequestSchema = new mongoose.Schema({
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
    enum: Object.values(TRANSFER_STATUS),
    default: TRANSFER_STATUS.PENDING,
  },
  status: {
    type: String,
    enum: Object.values(APPROVAL_STATUS),
    default: APPROVAL_STATUS.PENDING,
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
  meta: {},
  // providerResponse: [],
  time: Date,
  createdAt: { type: String },
  updatedAt: { type: String },
});

initiateRequestSchema.index({ transferStatus: 1 });


// Set the createdAt and updatedAt values before saving the document
initiateRequestSchema.pre("save", function (next) {
  const currentDate = toISOLocal();
  this.createdAt = currentDate;
  next();
})


module.exports = mongoose.model("InitiateRequest", initiateRequestSchema);
