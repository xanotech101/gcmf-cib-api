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
// router.get("/register_confirmation/:token", verifySuperUser);
router.post("/register_confirmation/:token", verifySuperUser);
router.post("/send_password_reset_link", forgetPassword);
router.post("/reset_password", changePassword);
router.post("/login", superUserLogin);

module.exports = router;
