const mongoose = require("mongoose");

const secretQuestionsSchema = new mongoose.Schema(
  {
    question: String,
    _id: mongoose.Schema.Types.ObjectId,
    createdAt: {
      type:Date,
      default: Date.now()
    },
    updatedAt: {
      type:Date,
      default: Date.now()
    },
  }
  
);

module.exports = mongoose.model("SecretQuestion", secretQuestionsSchema);
