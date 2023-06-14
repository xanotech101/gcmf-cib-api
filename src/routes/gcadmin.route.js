const express = require("express");
const { gcAuth } = require("../middleware/auth");
const { getAllAccountsByLabel } = require("../controller/account");
const { getAllusersTiedToGCAccount, getAllusersTiedToAnAccount, getGcAnalytics, dashBoardAnalytics } = require("../controller/gcadmin");

const router = express.Router();

router.get("/getAccount_oragnizationlabel/:organizationlabel", gcAuth, getAllAccountsByLabel)
router.get("/fetchAllusers", gcAuth, getAllusersTiedToGCAccount)
router.get("/fetchusersByAccount/:account", gcAuth, getAllusersTiedToAnAccount)
router.get("/anaylytics", gcAuth, getGcAnalytics)
router.get("/gc-report", gcAuth, dashBoardAnalytics)

module.exports = router;