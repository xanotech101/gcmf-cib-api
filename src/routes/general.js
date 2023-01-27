const express = require("express");
const {
  superUserAuth,
  adminAuth,
  initiatorAuth,
  verifierAuth,
  allUsersAuth,
} = require("../middleware/auth");
const router = express.Router();
const { getUsersByID, getUsersByOrgID } = require("../controller/general");
// const { verifyUser, getNewPassword } = require("../controller/emailServices");


router.get("/profile", allUsersAuth, getUsersByID);
router.get("/allbranchusers", adminAuth, getUsersByOrgID);

module.exports = router;
