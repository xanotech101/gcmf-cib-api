const mongoose = require("mongoose");
const { toISOLocal } = require("../utils/utils");

const mandateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    minAmount: Number,
    maxAmount: Number,
    organizationId: String,
    authorisers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    numberOfAuthorisers: Number,
    verifier:
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    createdAt: { type: String, default: toISOLocal(new Date()) },
    updatedAt: { type: String, default: toISOLocal(new Date()) },
  }
);

module.exports = mongoose.model("Mandate", mandateSchema);
