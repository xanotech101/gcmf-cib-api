
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const notificationSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["active", "approved", "declined", "authorized", "verified", "rejected"],
    },
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    initiator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InitiateRequest",
    },
    authorizers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    verifier: {
      type: mongoose.Schema.Types.ObjectId,
    },
    organization: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Notification", notificationSchema);
