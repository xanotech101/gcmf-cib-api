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
    createdAt: { type: String },
    updatedAt: { type: String },
  }
);

// Set the createdAt and updatedAt values before saving the document
otpSchema.pre("save", function (next) {
  const currentDate = toISOLocal();
  this.createdAt = currentDate;
  this.updatedAt = currentDate;
  next();
})

module.exports = mongoose.model("Otp", otpSchema);
