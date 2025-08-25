const bcrypt = require('bcryptjs');
const SecretQuestion = require('../model/secretQuestions.model');

class SecretQuestionService {
  async compareAnswer(dbAnswer, givenAnswer) {
    const isAnswerCorrect = await bcrypt.compare(givenAnswer, dbAnswer);
    return isAnswerCorrect;
  }
  async hashAnswer(answer) {
    const salt = await bcrypt.genSalt(10);
    const hashedAnswer = await bcrypt.hash(answer, salt);
    return hashedAnswer;
  }
  async getQuestionById(id) {
    const question = await SecretQuestion.findById(id);
    return question;
  }
}

module.exports = new SecretQuestionService();