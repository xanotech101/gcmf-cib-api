const mongoose = require("mongoose");
const { toISOLocal } = require("../utils/utils");

const secretQuestionsSchema = new mongoose.Schema(
  {
    question: String,
    _id: mongoose.Schema.Types.ObjectId,
    createdAt: { type: String },
    updatedAt: { type: String },
  }
  
);

// Set the createdAt and updatedAt values before saving the document
secretQuestionsSchema.pre("save", function (next) {
  const currentDate = toISOLocal();
  this.createdAt = currentDate;
  this.updatedAt = currentDate;
  next();
})

module.exports = mongoose.model("SecretQuestion", secretQuestionsSchema);
