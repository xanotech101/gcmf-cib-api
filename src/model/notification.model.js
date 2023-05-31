
const mongoose = require("mongoose");
const { toISOLocal } = require("../utils/utils");

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
    createdAt: { type: String },
    updatedAt: { type: String },
  }
);

// Set the createdAt and updatedAt values before saving the document
notificationSchema.pre("save", function (next) {
  const currentDate = toISOLocal();
  this.createdAt = currentDate;
  this.updatedAt = currentDate;
  next();
})

module.exports = mongoose.model("Notification", notificationSchema);
