const express = require("express");
const router = express.Router();

const {
  adminAuth,
  initiatorAuth,
  allUsersAuth,
  authoriserAuth,
} = require("../middleware/auth");

const {
  getAllAuditTrail,
} = require("../controller/general");
  
router.get("/audit_trails", allUsersAuth, getAllAuditTrail);



module.exports = router;