const express = require("express");
const router = express.Router();

const { getProviders, toggleProvider, createProvider } = require("../controller/bulkTransferProvider.controller");


const { superUserAuth } = require("../middleware/auth");


router.post("/", superUserAuth, createProvider);
router.get("/", superUserAuth, getProviders);
router.put("/:id", superUserAuth, toggleProvider);


module.exports = router;
