const express = require("express");
const { gcAuth } = require("../middleware/auth");
const { getAllusersTiedToGCAccount, getAllusersTiedToAnAccount, getGcAnalytics, getAllAccountsByGCLabel } = require("../controller/gcadmin");

const router = express.Router();

router.get("/getAccount_oragnizationlabel", gcAuth, getAllAccountsByGCLabel)
router.get("/fetchAllusers", gcAuth, getAllusersTiedToGCAccount)
router.get("/fetchusersByAccount/:account", gcAuth, getAllusersTiedToAnAccount)
router.get("/anaylytics", gcAuth, getGcAnalytics)

module.exports = router;