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
  changePassword,
  userLogin,
  registerAdmin,
} = require("../controller/user");
const { verifyUser, getNewPassword } = require("../controller/emailServices");

router.post("/register", adminAuth, registerUser); //register a user
router.post("/register/admin", superUserAuth, registerUser);
router.get("/register_confirmation/:token", verifyUser);  //send email after registration and verifies user
router.post("/send_password_reset_link", forgetPassword);  
router.get("/reset_password/:token", getNewPassword);
router.post("/reset_password", changePassword);
router.post("/login", userLogin);




module.exports = router;
