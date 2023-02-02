const Joi = require("joi");

const mandateSchemas = {
  createMandate: Joi.object().keys({
  name: Joi.string().lowercase().required(),
  minAmount: Joi.number().required(),
  maxAmount: Joi.number().required(),
  AuthorizerID: Joi.array().items(Joi.string().length(24).trim().required()),
}),

  
};

module.exports = mandateSchemas;
