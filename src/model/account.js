const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema(
  {
    organizationId: String,
    accountImageUrl: String,
    address: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Account", accountSchema);

