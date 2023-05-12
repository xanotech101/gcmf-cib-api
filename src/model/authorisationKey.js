const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { toISOLocal } = require("../utils/utils");

const authorisationKeySchema = new mongoose.Schema({
  bankNumber: String,
  token: String,
  createdAt: { type: String, default: toISOLocal(new Date()) },
  updatedAt: { type: String, default: toISOLocal(new Date()) },
});

module.exports = mongoose.model("AuthorisationKey", authorisationKeySchema);
