const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const priviledgeSchema = new mongoose.Schema(
  {
    name: String,
    type: Number,
    role: {
      type: String,
      required: true,
      enum: ["super-admin", "admin", "user"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Priviledge", priviledgeSchema);
