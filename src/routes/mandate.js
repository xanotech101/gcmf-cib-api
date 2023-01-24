const express = require("express");
const router = express.Router();
const { registerMandate, updateMandate } = require("../controller/mandate");


router.post("/register", registerMandate);
router.post("/update", updateMandate);



module.exports = router;
