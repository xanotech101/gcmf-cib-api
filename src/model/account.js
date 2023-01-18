const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema(
  {
    organizationId: String,
    accountImageUrl: String,
    password: {
      type: String,
      required: [true, "Please enter a password"],
      minlength: 8,
    },
    address: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Account", accountSchema);

