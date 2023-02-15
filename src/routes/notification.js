const express = require("express");
const router = express.Router();

const {
  getAllNotifiactions,
} = require("../controller/notification");
const { allUsersAuth,
    initiatorAuth,
    authoriserAuth,
    verifierAuth
} = require("../middleware/auth");

router.get("/:id", initiatorAuth, getAllNotifiactions);


module.exports = router;



