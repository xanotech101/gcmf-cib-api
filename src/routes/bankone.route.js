const express = require("express");
const router = express.Router();

const {
  getAccountByAccountNo,
  getAccountByCustomerID,
  getTransactionHistory,
  getAccountStatement,
  getNameEnquiry,
  getTransactionsPaginated,
} = require("../controller/bankone/bankDetails");
const { adminAuth } = require("../middleware/auth");

router.get("/details/:account", adminAuth, getAccountByAccountNo);
router.get("/detail/:customerId", adminAuth, getAccountByCustomerID);
router.get("/history", adminAuth, getTransactionHistory);
router.get("/statement/:account", adminAuth, getAccountStatement);
router.post("/enquiry", adminAuth, getNameEnquiry);
router.get("/tansactions/:account", adminAuth, getTransactionsPaginated);


module.exports = router;


