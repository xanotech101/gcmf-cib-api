const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const initiateRequestSchema = new mongoose.Schema(
  {
    requestID: String,
    mandateID: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "Mandate",
    },
    customerName: String,
    amount: Number,
    bankName: String,
    accountNumber: String,
    accountName: String,
    transferStatus: String,
    authorizerID: [String],
    initiatorID: {
       type: mongoose.Schema.Types.ObjectID,
      ref: "User",
    },
    isApproved: {
      type: String,
      enum: ["active", "approved", "decline"],
    },
    declineResponse: [
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

initiateRequestSchema.methods.generateAuthToken = function () {
  const token = jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
  return token;
};

module.exports = mongoose.model("InitiateRequest", initiateRequestSchema);
