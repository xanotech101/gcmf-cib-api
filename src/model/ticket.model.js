const mongoose = require("mongoose");

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
    meta: {}
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Ticket", ticketSchema);
