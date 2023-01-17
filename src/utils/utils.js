const Joi = require("joi");

function validateUser(user) {
  const userSchema = Joi.object()
    .keys({
      firstName: Joi.string().min(3).max(20).lowercase().required(),
      lastName: Joi.string().min(3).max(20).lowercase().required(),
      email: Joi.string().min(6).max(40).trim().lowercase().required().email(),
      password: Joi.string().required().min(8),
      confirm_password: Joi.ref("password").required(),
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
    

  return Joi.validate(user, userSchema);
}

exports.validate = validateUser;
