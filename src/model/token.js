const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { toISOLocal } = require("../utils/utils");

const csrfSchema = new mongoose.Schema(
  {
    token: String,
    createdAt: { type: String, default: toISOLocal(new Date()) },
  updatedAt: { type: String, default: toISOLocal(new Date()) },
  },
  
);

module.exports = mongoose.model("Csrf", csrfSchema);
