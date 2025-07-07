const express = require("express");
const router = express.Router();

const { balanceEnquiry, fundTransfer, nameEnquiry } = require("../controller/eazyPay/eazyPay");

router.post("/balanceEnquiry", balanceEnquiry);
router.post("/fundTransfer", fundTransfer);
router.post("/nameEnquiry", nameEnquiry);

module.exports = router;