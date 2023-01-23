const express = require("express");
const router = express.Router();
const { registerMandate, updateMandate } = require("../controller/mandate");
const { update } = require("lodash");


router.post("/register", registerMandate);
router.post("/update", updateMandate);



module.exports = router;
