const Joi = require("joi");

const accountSchemas = {
  createAccount: Joi.object({
    accountDetails: Joi.object({
      accountNumber: Joi.string()
        .pattern(/^[0-9]+$/)
        .required(),
      accountName: Joi.string().required(),
    }).required(),
    admin: Joi.object({
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      email: Joi.string().email().required(),
      phone: Joi.string().pattern(/^\d+$/).length(11).required(),
      gender: Joi.string().valid("male", "female").required(),
      imageUrl: Joi.string().required(),
      privileges: Joi.array().items(Joi.string()).required(),
    }).required(),
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
