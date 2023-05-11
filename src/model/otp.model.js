const mongoose = require("mongoose");
const { toISOLocal } = require("../utils/utils");

const otpSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "User",
    },
    transaction: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "InitiateRequest",
    },
    context: String,
    otp: String,
    createdAt: { type: String, default: toISOLocal(new Date()) },
  updatedAt: { type: String, default: toISOLocal(new Date()) },
  }
);

module.exports = mongoose.model("Otp", otpSchema);
