const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

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

accountSchema.methods.generateAuthToken = function () {
  const token = jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
  return token;
};

module.exports = mongoose.model("Account", accountSchema);

