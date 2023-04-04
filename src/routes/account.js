const express = require("express");
const { validate, accountSchemas } = require("../validations");
const { superUserAuth, adminAuth, allUsersAuth } = require("../middleware/auth");

const router = express.Router();
const {
  getAllAccount,
  registerAccount,
  verifyAccount,
  getAccount,
} = require("../controller/account");

router.post(
  "/register",
  superUserAuth,
  // validate(accountSchemas.createAccount, "body"),
  registerAccount
);

router.get("/all_accounts", getAllAccount);

router.get(
  "/verify-account/:token",
  // validate(accountSchemas.verifyAccount, "params"),
  verifyAccount
);

router.get("/all_accounts/:id", allUsersAuth, getAccount);

module.exports = router;