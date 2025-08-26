const express = require("express");
const router = express.Router();

const {
  getProviders,
  toggleProviderStatus,
  createProvider,
} = require("../controller/transferProvider/transferProvider.controller");


const { superUserAuth } = require("../middleware/auth");


router.post("/", superUserAuth, createProvider);
router.get("/", superUserAuth, getProviders);
router.put("/:providerId", superUserAuth, toggleProviderStatus);


module.exports = router;
