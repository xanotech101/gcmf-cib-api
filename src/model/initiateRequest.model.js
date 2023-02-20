const mongoose = require("mongoose");

const initiateRequestSchema = new mongoose.Schema(
  {
    mandate: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "Mandate",
    },
    customerName: String,
    amount: Number,
    bankName: String,
    accountNumber: String,
    accountName: String,
    transferStatus: String,
    initiator: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "User",
    },
    verifier: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "User",
    },
    status: {
      type: String,
      enum: [
        "pending",
        "in progress",
        "awaiting verification",
        "approved",
        "declined",
      ],
      default: "pending",
    },
    numberOfAuthorisers: Number,
    authorisersAction: [
      {
        status: {
          type: String,
          enum: ["authorised", "rejected"],
        },
        authoriserID: {
          type: mongoose.Schema.Types.ObjectID,
          ref: "User",
        },
        reason: String,
      },
    ],
    time: Date,
  },
  {
    timestamps: { type: Date, required: true, unique: true },
  }
);

module.exports = mongoose.model("InitiateRequest", initiateRequestSchema);



