const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "User",
    },
    isActive: Boolean,
    context: Srting,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Otp", otpSchema);
