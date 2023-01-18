const express = require("express");
const router = express.Router();
const registerAccount = require("../controller/account");

router.post("/register", registerAccount);


module.exports = router;
