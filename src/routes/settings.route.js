const express = require("express");
const UpdateSecrete = require("../controller/settings/settings");
const { allUsersAuth } = require("../middleware/auth");
const { validate, accountSchemas } = require("../validations");
const router = express.Router();

router.patch("/update_secrete_questions",allUsersAuth, validate(accountSchemas.sercreteUpdate, "body"),UpdateSecrete);

module.exports = router;
