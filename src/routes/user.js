const express = require("express");
const {
  superUserAuth,
  adminAuth,
  initiatorAuth,
  verifierAuth,
} = require("../middleware/auth");
const router = express.Router();
const {
  registerUser,
  forgetPassword,
  userLogin,
} = require("../controller/user");
const { verifyUser, getNewPassword } = require("../controller/emailServices");

router.post("/register", adminAuth, registerUser); //register a user
router.post("/admin-register", superUserAuth, registerUser);
router.get("/register_confirmation/:token", verifyUser);  //send email after registration and verifies user
router.post("/send_password_reset_link", forgetPassword);  
router.post("/reset_password", getNewPassword);
router.post("/login", userLogin);




module.exports = router;
