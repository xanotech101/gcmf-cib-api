const mongoose = require("mongoose");

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

module.exports = mongoose.model("Mandate", mandateSchema);
