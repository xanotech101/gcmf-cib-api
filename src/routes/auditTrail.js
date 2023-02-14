const express = require("express");
const router = express.Router();

const { getAllAuditTrail } = require("../controller/auditTrail");
const { allUsersAuth } = require("../middleware/auth");

router.get("/audit_trails", allUsersAuth, getAllAuditTrail);


module.exports = router;