const mongoose = require("mongoose");

const authQuestionsSchema = new mongoose.Schema(
  {
    authQuestions: [
      {
        type: String,
      }
    ],
    createdAt: {
      type: Date,
      default: Date.now()
    },
    updatedAt: {
      type: Date,
      default: Date.now()
    },
  },

);

module.exports = mongoose.model("AuthQuestions", authQuestionsSchema);
