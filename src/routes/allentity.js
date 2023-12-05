const express = require("express");
const { entityAuth } = require("../middleware/auth");
const { getAllAccountsByLabel } = require("../controller/account");
const { getAllusersTiedToGCAccount, getAllusersTiedToAnAccount, getallEntityAnalytics, dashBoardAnalytics, transferRequest, allEntityAudit } = require("../controller/allentity");

const router = express.Router();

router.get("/accounts", entityAuth, getAllAccountsByLabel)
router.get("/fetchAllusers", entityAuth, getAllusersTiedToGCAccount)
router.get("/fetchusersByAccount/:account", entityAuth, getAllusersTiedToAnAccount)
router.get("/analytics/:year", entityAuth, getallEntityAnalytics)
router.get("/dashboard-analytics", entityAuth, dashBoardAnalytics)
router.get("/transferRequest",entityAuth, transferRequest)
router.get("/audit-trails", entityAuth, allEntityAudit)

module.exports = router;