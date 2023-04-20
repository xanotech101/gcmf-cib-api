const express = require("express");
const router = express.Router();

const {
  getAllPrivileges,
} = require("../controller/privilege/privilege.controller");
const {allUsersAuth} = require("../middleware/auth");

router.get("/", allUsersAuth, getAllPrivileges);

module.exports = router;
