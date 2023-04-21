const express = require("express");
const router = express.Router();

const {
  getAllTickets,
  getMyTickets,
  createTicket,
  replyTicket,
  getMyOrganizationTickets,
  getSingleTicket
} = require("../controller/ticket/ticket.controller.js");

const { superUserAuth, allUsersAuth } = require("../middleware/auth");

router.get("/all", superUserAuth, getAllTickets);
router.get("/mine", allUsersAuth, getMyTickets);
router.post("/create", allUsersAuth, createTicket);
router.post("/reply/:id", allUsersAuth, replyTicket);
router.get("/organization", allUsersAuth, getMyOrganizationTickets);
router.get("/:id", allUsersAuth, getSingleTicket);

module.exports = router;
