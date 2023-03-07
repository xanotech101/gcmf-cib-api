const express = require("express");
const { validate, accountSchemas } = require("../validations");
const { superUserAuth, adminAuth } = require("../middleware/auth");

const router = express.Router();
const { registerAccount, verifyAccount } = require("../controller/account");

router.post(
  "/register",
  superUserAuth,
  validate(accountSchemas.createAccount, "body"),
  registerAccount
);
router.post(
  "/verify-account/:token",
  validate(accountSchemas.verifyAccount, "params"),
  verifyAccount
);

module.exports = router;
