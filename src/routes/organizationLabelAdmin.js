const express = require("express");
const { organizationLabelAdminAuth } = require("../middleware/auth");
const { getAllAccountsByLabel } = require("../controller/account");
const { getAllusersTiedToGCAccount, getAllusersTiedToAnAccount, getallOrganizationLabelAnalytics, dashBoardAnalytics, transferRequest, organizationLabelAudit } = require("../controller/organizationLabelAdmin");

const router = express.Router();

router.get("/accounts", organizationLabelAdminAuth, getAllAccountsByLabel)
router.get("/fetchAllusers", organizationLabelAdminAuth, getAllusersTiedToGCAccount)
router.get("/fetchusersByAccount/:account", organizationLabelAdminAuth, getAllusersTiedToAnAccount)
router.get("/analytics/:year", organizationLabelAdminAuth, getallOrganizationLabelAnalytics)
router.get("/dashboard-analytics", organizationLabelAdminAuth, dashBoardAnalytics)
router.get("/transferRequest",organizationLabelAdminAuth, transferRequest)
router.get("/audit-trails", organizationLabelAdminAuth, organizationLabelAudit)

module.exports = router;