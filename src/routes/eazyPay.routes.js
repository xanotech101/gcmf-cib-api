const express = require("express");
const { eazypayWebhook } = require("../webhooks/eazypay/eazypay");
const { webhookValidation } = require("../validations/webhook.validation");
const { resetToken, openBatch } = require("../controller/eazypay");
const router = express.Router();


router.post("/multipay_webhook", eazypayWebhook);
router.get("/resetToken", resetToken)
router.post("/open-batch", openBatch)


module.exports = router;