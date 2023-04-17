
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "User",
    },
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InitiateRequest",
    },
    message: String,
    title: {
      type: String,
    },
    read: {
      type: Boolean,
      default: false,
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

module.exports = mongoose.model("Notification", notificationSchema);
