const express = require("express");
const router = express.Router();

const {
  getAllNotifiactionForInitiator,
  getAllNotifiactionForAuthoriser,
  getAllNotifiactionForVerifier,
} = require("../controller/notification");
const { allUsersAuth,
    initiatorAuth,
    authoriserAuth,
    verifierAuth
} = require("../middleware/auth");

router.get("/initiator", initiatorAuth, getAllNotifiactionForInitiator);
router.get("/authoriser", authoriserAuth, getAllNotifiactionForAuthoriser);
router.get("/verifier", verifierAuth, getAllNotifiactionForVerifier);

module.exports = router;



