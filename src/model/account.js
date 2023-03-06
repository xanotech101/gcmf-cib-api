const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const accountSchema = new mongoose.Schema(
  {
    name: String,
    accountNumber: {
      type: String,
      required: [true, "Please enter an account number"],
      unique: true
    },
    customerID: String,
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

