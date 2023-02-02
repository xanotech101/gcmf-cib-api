const express = require("express");
const router = express.Router();
const {
  registerMandate,
  updateMandate,
  getAllMandates,
  getSingleMandate
} = require("../controller/mandate");
const { validate, mandateSchemas } = require("../validations");


router.post("/create",
  validate(mandateSchemas.createMandate, "body"),
  registerMandate);
router.post("/update", updateMandate);
router.get("/all", getAllMandates);
router.get("/:id", getSingleMandate);






module.exports = router;
