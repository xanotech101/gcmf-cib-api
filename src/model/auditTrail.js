const mongoose = require("mongoose");

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
    createdAt: {
      type: Date,
      default: Date.now()
    },
    updatedAt: {
      type: Date,
      default: Date.now()
    },
  },

);

module.exports = mongoose.model("auditTrail", auditTrailSchema);
