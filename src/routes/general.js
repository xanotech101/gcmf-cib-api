const express = require("express");
const {
  adminAuth,
  initiatorAuth,
  allUsersAuth,
} = require("../middleware/auth");
const router = express.Router();
const {
  initiateRequest,
} = require("../controller/general");


router.post("/request", initiatorAuth, initiateRequest);

module.exports = router;

