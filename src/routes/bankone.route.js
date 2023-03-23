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
  intrabankTransfer,
   getAccountDetails,
  getAccountInfo,
  getTransactionStatus
} = require("../controller/bankone/bankDetails");
const { adminAuth, allUsersAuth } = require("../middleware/auth");


router.get("/detail/:customerId", allUsersAuth, getAccountByCustomerID);
router.get("/balance", allUsersAuth, getAccountByAccountNo);
router.get("/history", allUsersAuth, getTransactionHistory);
router.get("/statement/:account", allUsersAuth, getAccountStatement);
router.post("/name-enquiry", allUsersAuth, getNameEnquiry);
router.get("/transactions/:account", allUsersAuth, getTransactionsPaginated);
router.post("/transfer/interbank", adminAuth, interbankTransfer);
router.post("/transfer/intrabank", adminAuth, intrabankTransfer);
router.post("/details", allUsersAuth, getAccountDetails);
router.get("/info", allUsersAuth, getAccountInfo);
router.post("/status", allUsersAuth, getTransactionStatus);


module.exports = router;