const express = require("express");
const router = express.Router();

const registerUser = require("../controller/user");
const verifyUser = require("../controller/emailServices");

router.post("/register", registerUser);
router.get("/confirmation/:token", verifyUser);

module.exports = router;
