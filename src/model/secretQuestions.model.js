const mongoose = require("mongoose");

const secretQuestionsSchema = new mongoose.Schema(
  {
    question: String,
    _id: mongoose.Schema.Types.ObjectId,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SecretQuestion", secretQuestionsSchema);
