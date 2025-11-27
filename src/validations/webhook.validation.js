const Joi = require("joi");

const webhookValidation = {
    eazypayWebhookSchema: Joi.object({
        transactionId: Joi.string().trim().required(),
        batchId: Joi.string().trim().optional(),
        status: Joi.string()
            .valid("SUCCESSFUL", "FAILED", "PENDING", "NOT_FOUND")
            .optional(),
        nipResponseCode: Joi.string()
            .pattern(/^[0-9A-Za-z]+$/)
            .optional(),
        message: Joi.string().allow(null, "").optional(),
        amount: Joi.number().optional(),
        accountNumber: Joi.string().trim().optional(),
        accountName: Joi.string().trim().optional(),
        bankCode: Joi.string().trim().optional(),
    })
}


module.exports = webhookValidation;
