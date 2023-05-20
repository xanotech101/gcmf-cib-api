const express = require("express");
const { gcAuth } = require("../middleware/auth");
const { getAllAccountsByLabel } = require("../controller/account");
const { getAllusersTiedToGCAccount, getAllusersTiedToAnAccount } = require("../controller/gcadmin");

const router = express.Router();

router.get("/getAccount_oragnizationlabel/:organizationlabel", gcAuth, getAllAccountsByLabel)
router.get("/fetchAllusers", gcAuth, getAllusersTiedToGCAccount)
router.get("/fetchusersByAccount/:account", gcAuth, getAllusersTiedToAnAccount)

module.exports = router;