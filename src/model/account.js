const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { toISOLocal } = require("../utils/utils");

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
    password: {
      type: String
    },
    customerID: String,
    organizationLabel:{
      type: mongoose.Schema.Types.ObjectID,
      ref: "organzationLabel",
    },
    verified: {
      type: Boolean,
      default: false,
    },
    createdAt: { type: String, default: toISOLocal(new Date()) },
  updatedAt: { type: String, default: toISOLocal(new Date()) },
  }
);

accountSchema.methods.generateAuthToken = function () {
  const token = jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {
    expiresIn: "1hr",
  });
  return token;
};

module.exports = mongoose.model("Account", accountSchema);
