const express = require("express");
const router = express.Router();
const { getAllSecretQuestions } = require("../controller/secretQuestion/secretQuestion.controller");

router.get("/", getAllSecretQuestions);

module.exports = router;
