const express = require("express");
const router = express.Router();

const { getAllAuditTrail } = require("../controller/auditTrail");

router.get("/audit_trails", allUsersAuth, getAllAuditTrail);
