const mongoose = require("mongoose");
const { toISOLocal } = require("../utils/utils");

const ticketSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    topic: String,
    message: String,
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
    },
    organizationLabel: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "organzationLabel",
    },
    response: [
      {
        responseBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        response: String,
        date: {
          type: Date,
          default: Date.now()
        }
      }
    ],
    meta: {},
    createdAt: { type: String },
    updatedAt: { type: String },
  },

);

// Set the createdAt and updatedAt values before saving the document
ticketSchema.pre("save", function (next) {
  const currentDate = toISOLocal();
  this.createdAt = currentDate;
  this.updatedAt = currentDate;
  next();
})

module.exports = mongoose.model("Ticket", ticketSchema);
