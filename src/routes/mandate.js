const express = require("express");
const router = express.Router();
const {
  registerMandate,
  updateMandate,
  getAllMandates,
} = require("../controller/mandate");


router.post("/create", registerMandate);
router.post("/update", updateMandate);
router.get("/all", getAllMandates);






module.exports = router;
