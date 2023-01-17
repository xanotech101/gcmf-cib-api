const express = require("express");
const router = express.Router();
const registerAccount = require("../controller/account");

router.get("/register", registerAccount);


module.exports = router;
