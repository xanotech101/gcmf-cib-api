const express = require("express");
const { gcAuth } = require("../middleware/auth");
const { getAllAccountsByLabel } = require("../controller/account");
const { getAllusersTiedToGCAccount, getAllusersTiedToAnAccount, getGcAnalytics, dashBoardAnalytics, transferRequest, gcAudit } = require("../controller/gcadmin");

const router = express.Router();

router.get("/accounts", gcAuth, getAllAccountsByLabel)
router.get("/fetchAllusers", gcAuth, getAllusersTiedToGCAccount)
router.get("/fetchusersByAccount/:account", gcAuth, getAllusersTiedToAnAccount)
router.get("/analytics/:year", gcAuth, getGcAnalytics)
router.get("/dashboard-analytics", gcAuth, dashBoardAnalytics)
router.get("/transferRequest",gcAuth, transferRequest)
router.get("/audit-trails", gcAuth, gcAudit)

module.exports = router;