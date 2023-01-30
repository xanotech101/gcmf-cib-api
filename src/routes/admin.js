const express = require("express");
const router = express.Router();
const {
  registerAdmin,
  forgetPassword,
  changePassword,
  adminLogin,
} = require("../controller/admin");
const {
  verifySuperUser,
  getNewPassword,
} = require("../controller/emailServices");

const {
  superUserAuth,
  adminAuth,
  initiatorAuth,
  verifierAuth,
} = require("../middleware/auth");



router.post("/register", registerAdmin); //register a user
// router.get("/register_confirmation/:token", verifyadmin);
router.get("/register_confirmation/:token", verifyAdmin);
router.post("/send_password_reset_link", forgetPassword);
router.get("/reset_password/:token", getNewPassword);
router.post("/reset_password", changePassword);
router.post("/login", adminLogin);

module.exports = router;
