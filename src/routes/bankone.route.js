const express = require("express");
const router = express.Router();

const {
  getAccountByAccountNo,
  getAccountByCustomerID,
  getTransactionHistory,
  getAccountStatement,
  getNameEnquiry,
  interbankTransfer,
  getAccountDetails,
  getAccountInfo,
  getTransactionStatus,
  getAccountByAccountNoV2,
  IntrabankAccountEnquiry,
  debitAccount
} = require("../controller/bankone/bankDetails");
const { adminAuth, allUsersAuth, superUserAuth } = require("../middleware/auth");


router.get("/detail/:customerId", allUsersAuth, getAccountByCustomerID);
router.get("/balance/:accountNo", allUsersAuth, getAccountByAccountNo);
router.get("/getaccount2/:accountNo", allUsersAuth, getAccountByAccountNoV2);
router.get("/history/:accountNo", allUsersAuth, getTransactionHistory);
router.get("/statement/:account", allUsersAuth, getAccountStatement);
router.post("/name-enquiry", allUsersAuth, getNameEnquiry);
router.post("/transfer/interbank", adminAuth, interbankTransfer);
router.post("/details", allUsersAuth, getAccountDetails);
router.get("/info", allUsersAuth, getAccountInfo);
router.post("/status", allUsersAuth, getTransactionStatus);
router.post("/intra-bank/name-enquiry", allUsersAuth, IntrabankAccountEnquiry);
router.post("/debit-account", allUsersAuth, debitAccount);


module.exports = router;