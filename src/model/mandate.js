const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const mandateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    minAmount:Number,   
    maxAmount:Number,
    AuthorizerID: [String],
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
