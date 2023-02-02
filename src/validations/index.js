const authSchemas = require("./auth.validation");
const mandateSchemas = require("./mandate.validation");


const validate = (schema, property) => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property], { abortEarly: false });

    if (error) {
      const { details } = error;
      return res.status(400).json({
        message: details[0].message,
        data: null,
        status: "failed",
      });
    }

    next();
  };
};

module.exports = {
  validate,
  authSchemas,
  mandateSchemas
}