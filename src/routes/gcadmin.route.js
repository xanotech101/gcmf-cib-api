const express = require("express");
const { gcAuth } = require("../middleware/auth");
const { getAllAccountsByLabel } = require("../controller/account");
const { getAllusersTiedToGCAccount, getAllusersTiedToAnAccount, getGcAnalytics, dashBoardAnalytics } = require("../controller/gcadmin");

const router = express.Router();

router.get("/accounts", gcAuth, getAllAccountsByLabel)
router.get("/fetchAllusers", gcAuth, getAllusersTiedToGCAccount)
router.get("/fetchusersByAccount/:account", gcAuth, getAllusersTiedToAnAccount)
router.get("/anaylytics", gcAuth, getGcAnalytics)
router.get("/dashboard-analytics", gcAuth, dashBoardAnalytics)

module.exports = router;