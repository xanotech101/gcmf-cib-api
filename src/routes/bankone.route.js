const express = require("express");
const router = express.Router();

const {
  getAccountByAccountNo,
  getAccountByCustomerID,
  getTransactionHistory,
  getAccountStatement,
  getNameEnquiry,
  getTransactionsPaginated,
  interbankTransfer,
   getAccountDetails,
  getAccountInfo,
  getTransactionStatus,
  getAccountByAccountNoV2
} = require("../controller/bankone/bankDetails");
const { adminAuth, allUsersAuth } = require("../middleware/auth");


router.get("/detail/:customerId", allUsersAuth, getAccountByCustomerID);
router.get("/balance/:accountNo", allUsersAuth, getAccountByAccountNo);
router.get("/getaccount2/:accountNo", allUsersAuth, getAccountByAccountNoV2);
router.get("/history/:accountNo", allUsersAuth, getTransactionHistory);
router.get("/statement/:account", allUsersAuth, getAccountStatement);
router.post("/name-enquiry", allUsersAuth, getNameEnquiry);
router.get("/transactions/:account", allUsersAuth, getTransactionsPaginated);
router.post("/transfer/interbank", adminAuth, interbankTransfer);
router.post("/details", allUsersAuth, getAccountDetails);
router.get("/info", allUsersAuth, getAccountInfo);
router.post("/status", allUsersAuth, getTransactionStatus);


module.exports = router;