const mongoose = require("mongoose");
const { toISOLocal } = require("../utils/utils");

const auditTrailSchema = new mongoose.Schema(
  {
    type: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InitiateRequest",
    },
    organization: {
      type: String
    },
    message: String,
    organizationId: String,
    createdAt: { type: String, default: toISOLocal(new Date()) },
  updatedAt: { type: String, default: toISOLocal(new Date()) },
  },

);

module.exports = mongoose.model("auditTrail", auditTrailSchema);
