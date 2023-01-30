const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const initiateRequestSchema = new mongoose.Schema(
  {
    customerName: String,
    amount: Number,
    bankName: String,
    accountNumber: String,
    accountName: String,
  },
  {
    timestamps: true,
  }
);

initiateRequestSchema.methods.generateAuthToken = function () {
  const token = jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
  return token;
};

module.exports = mongoose.model("InitiateRequest", initiateRequestSchema);
