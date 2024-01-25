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
    organizationLabel: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "organzationLabel",
    },
    message: String,
    organizationId: String,
    createdAt: { type: String },
    updatedAt: { type: String },
  },

);

// Set the createdAt and updatedAt values before saving the document
auditTrailSchema.pre("save", function (next) {
  const currentDate = toISOLocal();
  this.createdAt = currentDate;
  this.updatedAt = currentDate;
  next();
})

module.exports = mongoose.model("auditTrail", auditTrailSchema);
