const express = require("express");
const router = express.Router();
const {
  registerMandate,
  updateMandate,
  getAllMandates,
} = require("../controller/mandate");


router.post("/register", registerMandate);
router.post("/update", updateMandate);
router.post("/all", updateMandate);






module.exports = router;
