const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { toISOLocal } = require("../utils/utils");

const authorisationKeySchema = new mongoose.Schema({
  bankNumber: String,
  token: String,
  createdAt: { type: String },
  updatedAt: { type: String },
});

// Set the createdAt and updatedAt values before saving the document
authorisationKeySchema.pre("save", function (next) {
  const currentDate = toISOLocal();
  this.createdAt = currentDate;
  this.updatedAt = currentDate;
  next();
})

module.exports = mongoose.model("AuthorisationKey", authorisationKeySchema);
