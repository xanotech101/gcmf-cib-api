const Joi = require("joi");

const validateAccount = (account) => (payload) =>
  account.validate(payload, { abortEarly: false });
const accountSchema = Joi.object()
  .keys({
    accountImageUrl: Joi.string(),
    address: Joi.string().required(),
    password: Joi.string().min(8).required().label("Password"),
    confirm_password: Joi.any()
      .equal(Joi.ref("password"))
      .required()
      .label("Confirm password")
      .messages({ "any.only": "{{#label}} does not match" }),
  })
  .with("password", "confirm_password");

exports.validateAccountSignup = validateAccount(accountSchema);


const validateUser = (user) => (payload) =>
  user.validate(payload, { abortEarly: false });
const userSchema = Joi.object()
  .keys({
    firstName: Joi.string().min(3).max(20).lowercase().required(),
    lastName: Joi.string().min(3).max(20).lowercase().required(),
    email: Joi.string().min(6).max(40).trim().lowercase().required().email(),
    password: Joi.string().min(8).required().label("Password"),
    confirm_password: Joi.any()
      .equal(Joi.ref("password"))
      .required()
      .label("Confirm password")
      .messages({ "any.only": "{{#label}} does not match" }),
    designation: Joi.string().required(),
    phone: Joi.string()
      .length(11)
      .pattern(/^[0-9]+$/)
      .required(),
    gender: Joi.string().required(),
    organizationId: Joi.string().required(),
    imageUrl: Joi.string(),
    priviledge: Joi.array().items(Joi.string().required()),
  })
  .with("password", "confirm_password");
exports.validateUserSchema = validateUser(userSchema);


const validateUserLogin = (user) => (payload) =>
  user.validate(payload, { abortEarly: false });
const userLoginSchema = Joi.object().keys({
  email: Joi.string().min(6).max(40).trim().lowercase().required().email(),
  password: Joi.string().min(8).required().label("Password"),
});
exports.validateUserLoginSchema = validateUserLogin(userLoginSchema);


const validateForgetPassword = (user) => (payload) =>
  user.validate(payload, { abortEarly: false });
const forgetPasswordSchema = Joi.object().keys({
  email: Joi.string().min(6).max(40).trim().lowercase().required().email(),
});
exports.validateForgetUserPasswordSchema =
  validateForgetPassword(forgetPasswordSchema);

const validateChangePassword = (user) => (payload) =>
  user.validate(payload, { abortEarly: false });
const changePasswordSchema = Joi.object()
  .keys({
    email: Joi.string().min(6).max(40).trim().lowercase().required().email(),
    password: Joi.string().min(8).required().label("Password"),
    confirm_password: Joi.any()
      .equal(Joi.ref("password"))
      .required()
      .label("Confirm password")
      .messages({ "any.only": "{{#label}} does not match" }),
  })
  .with("password", "confirm_password");
exports.validateChangePasswordSchema =
  validateChangePassword(changePasswordSchema);

const validateMandate = (mandate) => (payload) =>
  mandate.validate(payload, { abortEarly: false });
const mandateSchema = Joi.object().keys({
  name: Joi.string().lowercase().required(),
  minAmount: Joi.number().required(),
  maxAmount: Joi.number().required(),
  AuthorizerID: Joi.array().items(Joi.string().length(24).trim().required()),
});
exports.validateMandateSchema = validateMandate(mandateSchema);


const updateMandate = (mandate) => (payload) =>
  mandate.validate(payload, { abortEarly: false });
const updatemandateSchema = Joi.object().keys({
  name: Joi.string().lowercase(),
  minAmount: Joi.number(),
  maxAmount: Joi.number(),
  AuthorizerID: Joi.array().items(Joi.string().length(24).trim()),
});
exports.validateUpdateMandateSchema = updateMandate(updatemandateSchema);


//USER SCHEMA
const validateSuperUser = (user) => (payload) =>
  user.validate(payload, { abortEarly: false });
const superUserSchema = Joi.object()
  .keys({
    firstName: Joi.string().min(3).max(20).lowercase().required(),
    lastName: Joi.string().min(3).max(20).lowercase().required(),
    email: Joi.string().min(6).max(40).trim().lowercase().required().email(),
    password: Joi.string().min(8).required().label("Password"),
    confirm_password: Joi.any()
      .equal(Joi.ref("password"))
      .required()
      .label("Confirm password")
      .messages({ "any.only": "{{#label}} does not match" }),
    designation: Joi.string().required(),
    phone: Joi.string()
      .length(11)
      .pattern(/^[0-9]+$/)
      .required(),
    gender: Joi.string().required(),
    organizationId: Joi.string().required(),
    imageUrl: Joi.string(),
    priviledge: Joi.array().items(Joi.string().required()),
  })
  .with("password", "confirm_password");
exports.validateSuperUserSchema = validateSuperUser(superUserSchema);



const validateRequest = (user) => (payload) =>
  user.validate(payload, { abortEarly: false });
const initiateRequestSchema = Joi.object().keys({
  customerName: Joi.string().min(3).max(60).lowercase().required(),
  amount: Joi.number().required(),
  bankName: Joi.string().required(),
  accountNumber: Joi.string().lenght(10).required(),
  accountName: Joi.string().min(3).max(60).lowercase().required(),
});
exports.validateInitiateRequestSchema = validateRequest(initiateRequestSchema);