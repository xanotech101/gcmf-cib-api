const express = require("express");
const { validate, accountSchemas } = require("../validations");
const { superUserAuth, adminAuth, allUsersAuth, gcAuth } = require("../middleware/auth");

const router = express.Router();
const {
  getAllAccount,
  registerAccount,
  verifyAccount,
  getAccount,
  bulkOnboard,
  DeleteAccount
} = require("../controller/account");
const upload = require("../middleware/multer");

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

//onboard multiple account
router.post("/bulkOnboard", superUserAuth, upload.array("files"), bulkOnboard)
router.delete("/deleteAccount/:id", superUserAuth, DeleteAccount)


module.exports = router;