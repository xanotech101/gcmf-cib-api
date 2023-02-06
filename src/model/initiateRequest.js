const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Mandate = require("./mandate");

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
