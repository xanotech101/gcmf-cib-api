const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const accountSchema = new mongoose.Schema(
  {
    accountName: String,
    accountNumber: {
      type: Array,
      required: [true, "Please enter an account number"],
      unique: true,
    },
    accountToken: String,
    adminID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    customerID: String,
    verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

accountSchema.methods.generateAuthToken = function () {
  const token = jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {
    expiresIn: "1hr",
  });
  return token;
};

module.exports = mongoose.model("Account", accountSchema);
