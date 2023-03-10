const mongoose = require("mongoose");
const SecretQuestion = require("../model/secretQuestions.model");

const secretQuestions = [
  {
    question: "What is your mother's maiden name?",
    _id: mongoose.Types.ObjectId("6408750686aba885d609e701"),
  },
  {
    question: "What is your pet's name?",
    _id: mongoose.Types.ObjectId("63f697a2177cf066f56c2abd"),
  },
  {
    question: "What is your favorite color?",
    _id: mongoose.Types.ObjectId("63f697bf78528f949a0c175b"),
  },
  {
    question: "What is your favorite food?",
  },
  {
    question: "What is your favorite movie?",
    _id: mongoose.Types.ObjectId("640874edab64b5fa42a18eaa"),
  },
  {
    question: "What is your favorite sport?",
    _id: mongoose.Types.ObjectId("6408743597b4ae8e44ae48a9"),
  },
  {
    question: "What is your favorite book?",
    _id: mongoose.Types.ObjectId("6408743c47443824a2d876ac"),
  },
  {
    question: "What is your favorite song?",
    _id: mongoose.Types.ObjectId("640875544a1c6507ce32d659"),
  },
  {
    question: "What is your favorite game?",
    _id: mongoose.Types.ObjectId("6408744cecbe5049e769f09b"),
  },
  {
    question: "What is your favorite drink?",
    _id: mongoose.Types.ObjectId("640875abfb2d93a1c9509ec3"),
  }
];

const seedSecretQuestions = async () => {
  try {
    await SecretQuestion.insertMany(secretQuestions);
    console.log("Secret Questions seeded");
  } catch (error) {
    console.log(error);
  }
}

module.exports = seedSecretQuestions