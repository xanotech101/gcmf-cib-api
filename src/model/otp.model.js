const mongoose = require("mongoose");

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

module.exports = mongoose.model("Otp", otpSchema);
