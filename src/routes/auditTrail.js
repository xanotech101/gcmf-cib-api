const express = require("express");
const router = express.Router();

const { getAllAuditTrail, getOrganizationAuditTrail, getAuditTrailForSingleUser } = require("../controller/auditTrail");
const { allUsersAuth, superUserAuth } = require("../middleware/auth");

router.get("/all", superUserAuth, getAllAuditTrail);
router.get("/organization", allUsersAuth, getOrganizationAuditTrail);
router.get("/user/:userId", allUsersAuth, getAuditTrailForSingleUser);


module.exports = router;