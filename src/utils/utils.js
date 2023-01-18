const Joi = require("joi");

const validateAccount = (account) => (payload) =>
  account.validate(payload, { abortEarly: false });

const accountSchema = Joi.object().keys({
  accountImageUrl: Joi.string(),
  address: Joi.string().required(),
});

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

// const Joi = require("joi");

// exports.validateAccountSchema = Joi.object().keys({
//   imageUrl: Joi.string(),
//   address: Joi.string().required(),
// });

//   exports.validateUserSchema = Joi.object()
//     .keys({
//       firstName: Joi.string().min(3).max(20).lowercase().required(),
//       lastName: Joi.string().min(3).max(20).lowercase().required(),
//       email: Joi.string().min(6).max(40).trim().lowercase().required().email(),
//       password: Joi.string().min(8).required().label("Password"),
//       confirm_password: Joi.any()
//         .equal(Joi.ref("password"))
//         .required()
//         .label("Confirm password")
//         .messages({ "any.only": "{{#label}} does not match" }),
//       designation: Joi.string().required(),
//       phone: Joi.string()
//         .length(11)
//         .pattern(/^[0-9]+$/)
//         .required(),
//       gender: Joi.string().required(),
//       organizationId: Joi.string().required(),
//       imageUrl: Joi.string(),
//       priviledge: Joi.array().items(Joi.string().required()),
//     })
//     .with("password", "confirm_password");

// //Options
// exports.options = {
//   abortEarly: false,
//   errors: {
//     wrap: {
//       label: "",
//     },
//   },
// };




