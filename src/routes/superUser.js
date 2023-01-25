const express = require("express");
const router = express.Router();
const {
  registerSuperUser,
  forgetPassword,
  changePassword,
  superUserLogin,
} = require("../controller/superUser");
const {
  verifySuperUser,
  getNewPassword,
} = require("../controller/emailServices");

router.post("/register", registerSuperUser); //register a user
router.get("/register_confirmation/:token", verifySuperUser); //send email after registration and verifies user
router.post("/send_password_reset_link", forgetPassword);
router.get("/reset_password/:token", getNewPassword);
router.post("/reset_password", changePassword);
router.post("/login", superUserLogin);

module.exports = router;
