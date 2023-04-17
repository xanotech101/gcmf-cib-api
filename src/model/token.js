const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const csrfSchema = new mongoose.Schema(
  {
    token: String,
    createdAt: {
      type:Date,
      default: Date.now()
    },
    updatedAt: {
      type:Date,
      default: Date.now()
    },
  },
  
);

module.exports = mongoose.model("Csrf", csrfSchema);
