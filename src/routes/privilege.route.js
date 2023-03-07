const express = require("express");
const { getAllPrivileges } = require("../controller/privilege/privilege.controller");
const { adminAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", adminAuth, getAllPrivileges);


module.exports = router;
