const express = require("express");
const router = express.Router();
const { validate, authSchemas } = require("../validations");

const { superUserAuth, adminAuth } = require("../middleware/auth");
const {
  forgetPassword,
  login,
  resetPassword,
  verifyUser,
  registerUser,
} = require("../controller/auth/auth.controller");

//general route
router.post("/login", validate(authSchemas.login, "body"), login);
router.post(
  "/register",
  adminAuth,
  registerUser
);

router.post(
  "/register_confirmation/:token",
  validate(authSchemas.verifyUser, "params"),
  verifyUser
);
router.post(
  "/send_password_reset_link",
  validate(authSchemas.forgetPassword, "body"),
  forgetPassword
);
router.post(
  "/reset_password",
validate(authSchemas.resetPassword, "body"),
  resetPassword
);

// admin route
router.post(
  "/admin/register",
  adminAuth,
  validate(authSchemas.register, "body"),
  registerUser
);  

//super admin route
router.post(
  "/super_admin/register",
  validate(authSchemas.register, "body"),
  registerUser
);

module.exports = router;