const express = require("express");
const { createOrganizationLabel, getAllOrganizationLabel } = require("../controller/organization/organization");
const router = express.Router();
const { allUsersAuth } = require("../middleware/auth");

router.post(
  "/create_label",
  allUsersAuth, createOrganizationLabel
);

router.get("/all", allUsersAuth, getAllOrganizationLabel)
module.exports = router;
