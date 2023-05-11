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
    createdAt: { type: String, default: toISOLocal(new Date()) },
    updatedAt: { type: String, default: toISOLocal(new Date()) },
  },

);

module.exports = mongoose.model("Ticket", ticketSchema);
