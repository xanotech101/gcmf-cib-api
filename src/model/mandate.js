const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("../model/user.model");

const mandateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    minAmount:Number,   
    maxAmount: Number,
    AuthorizerID: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
  },
  {
    timestamps: true,
  }
);

mandateSchema.methods.generateAuthToken = function () {
  const token = jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
  return token;
};

module.exports = mongoose.model("Mandate", mandateSchema);
