const express = require("express");
const UpdateSecrete = require("../controller/settings/settings");
const { allUsersAuth } = require("../middleware/auth");
const { validate, accountSchemas } = require("../validations");
const router = express.Router();

router.patch("/update_secrete_questions",validate(accountSchemas.sercreteUpdate) ,allUsersAuth, UpdateSecrete);

module.exports = router;
