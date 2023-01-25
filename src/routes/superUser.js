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
router.get("/register_confirmation/:token", verifySuperUser);
router.get("/reg", (req, res) => res.send("Hello World!"));
router.post("/send_password_reset_link", forgetPassword);
router.get("/reset_password/:token", getNewPassword);
router.post("/reset_password", changePassword);
router.post("/login", superUserLogin);

module.exports = router;
