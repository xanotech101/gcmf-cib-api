const express = require("express");
const router = express.Router();

const {
  getAllPrivileges,createPrivileges
} = require("../controller/privilege/privilege.controller");
const {allUsersAuth, superUserAuth} = require("../middleware/auth");

router.post("/", superUserAuth, createPrivileges);
router.get("/", allUsersAuth, getAllPrivileges);

module.exports = router;
