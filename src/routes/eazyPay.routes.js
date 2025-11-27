const express = require("express");
const { eazypayWebhook } = require("../webhooks/eazypay/eazypay");
const { webhookValidation } = require("../validations/webhook.validation");
const router = express.Router();


router.post("/multipay_webhook", eazypayWebhook);


module.exports = router;