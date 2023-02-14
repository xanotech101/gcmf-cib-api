const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { PER_PAGE } = require("../../utils/constants");

const auditTrailSchema = new mongoose.Schema(
  {
    type: String,
    userID: String,
    transactionID: String
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("auditTrail", auditTrailSchema);
 