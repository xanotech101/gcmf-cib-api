const Joi = require("joi");

const accountSchemas = {
  createAccount: Joi.object().keys({
    organizationId: Joi.string().max(40).trim().lowercase().required(),
    accountName: Joi.string().max(40).trim().lowercase().required(),
    accountNumber: Joi.array().items(Joi.string().max(40).trim().lowercase().required()).required(),
    adminId: Joi.string().max(40).trim().lowercase().required(),
    address: Joi.string().max(40).trim().lowercase().required(),
  }),

  sercreteUpdate: Joi.object().keys({
    token: Joi.string(),
      secrets: Joi.array().items(
        Joi.object({
          question: Joi.string().required(),
          answer: Joi.string().required(),
          question: Joi.string().required(),
          answer: Joi.string().required(),
          question: Joi.string().required(),
          answer: Joi.string().required(),
        })
      ).required()
  }),
  
  verifyAccount: Joi.object()
    .keys({
      secrets: Joi.array().items(Joi.object().required()).required(),
      token: Joi.string().required(),
      password: Joi.string().required(),
      confirm_password: Joi.any()
        .equal(Joi.ref("password"))
        .required()
        .label("Confirm password")
        .messages({ "any.only": "{{#label}} does not match" }),

      token: Joi.string().required(),
    })
    .with("password", "confirm_password"),
};

module.exports = accountSchemas;
