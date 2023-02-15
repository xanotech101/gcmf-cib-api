
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const notificationSchema = new mongoose.Schema(
  {
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InitiateRequest",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Notification", notificationSchema);
