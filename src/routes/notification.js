const express = require("express");
const router = express.Router();

const {
  getAllNotifiactionForInitiator,
} = require("../controller/notification");
const { allUsersAuth } = require("../middleware/auth");

router.get("/initiator", allUsersAuth, getAllNotifiactionForInitiator);

module.exports = router;

