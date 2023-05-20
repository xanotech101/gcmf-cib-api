const express = require("express");
const { gcAuth } = require("../middleware/auth");
const { getAllAccountsByLabel } = require("../controller/account");

const router = express.Router();

router.get("/getAccount_oragnizationlabel/:organizationlabel", gcAuth, getAllAccountsByLabel)

module.exports = router;