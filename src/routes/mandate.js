const express = require("express");
const router = express.Router();
const {
  registerMandate,
  updateMandate,
  getAllMandates,
  getSingleMandate
} = require("../controller/mandate");
const { validate, mandateSchemas } = require("../validations");
const {
  superUserAuth,
  adminAuth,
  allUsersAuth,
} = require("../middleware/auth");



router.post(
  "/create",
  validate(mandateSchemas.createMandate, "body"),
  superUserAuth,
  registerMandate
);
router.post("/update", superUserAuth, updateMandate);
router.get("/all", allUsersAuth, getAllMandates);
router.get("/:id", getSingleMandate);






module.exports = router;
