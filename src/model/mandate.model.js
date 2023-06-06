const mongoose = require("mongoose");
const { toISOLocal } = require("../utils/utils");

const mandateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    minAmount: Number,
    maxAmount: Number,
    organizationId: String,
    verifiers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    numberOfVerifiers: Number,
    authoriser:
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    createdAt: { type: String },
    updatedAt: { type: String },
  }
);

// Set the createdAt and updatedAt values before saving the document
mandateSchema.pre("save", function (next) {
  const currentDate = toISOLocal();
  this.createdAt = currentDate;
  this.updatedAt = currentDate;
  next();
})


module.exports = mongoose.model("Mandate", mandateSchema);
