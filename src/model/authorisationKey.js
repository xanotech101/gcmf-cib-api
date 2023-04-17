const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const authorisationKeySchema = new mongoose.Schema(
  {
    bankNumber: String,
    token: String,
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

module.exports = mongoose.model("AuthorisationKey", authorisationKeySchema);
