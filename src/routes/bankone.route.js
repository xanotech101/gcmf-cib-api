const express = require("express");
const router = express.Router();

const {
  getAccountByAccountNo,
  getAccountByCustomerID,
  getTransactionHistory,
  getAccountStatement,
} = require("../controller/bankone/bankDetails");
const { adminAuth } = require("../middleware/auth");

router.get("/details/:account", adminAuth, getAccountByAccountNo);
router.get("/details/:customerId", adminAuth, getAccountByCustomerID);
router.get("/history", adminAuth, getTransactionHistory);
router.get("/details/:/account", adminAuth, getAccountStatement);


module.exports = router;


