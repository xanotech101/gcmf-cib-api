const SecretQuestion = require("../../model/secretQuestions.model");

const getAllSecretQuestions = async (req, res) => {
  try {
    const securityQuestions = await SecretQuestion.find();
    res.status(200).json({
      message: "Successfully fetched questions",
      data: { securityQuestions },
      status: "success",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      status: "failed",
    });
  }
};

module.exports = {
  getAllSecretQuestions
};
