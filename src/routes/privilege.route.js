const express = require("express");
const router = express.Router();

const {
  getAllPrivileges,
  roleSwitchMailNotification,
  updateUserRole,
} = require("../controller/privilege/privilege.controller");
const { adminAuth, allUserAuth } = require("../middleware/auth");

// router.get("/", allUserAuth, getAllPrivileges);
router.post("/", adminAuth, roleSwitchMailNotification);
router.patch("/:token", adminAuth, updateUserRole);

module.exports = router;
