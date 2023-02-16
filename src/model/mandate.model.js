const mongoose = require("mongoose");

const mandateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    minAmount: Number,
    maxAmount: Number,
    authorizers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    verifier: 
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Mandate", mandateSchema);
