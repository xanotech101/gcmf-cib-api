const express = require("express");
const router = express.Router();

const { registerUser, forgetPassword, changePassword } = require("../controller/user");
const { verifyUser, verifyForgetPassword } = require("../controller/emailServices");

router.post("/register", registerUser); //register a user
router.get("/register_confirmation/:token", verifyUser);  //send email after registration and verifies user
router.post("/send_password_reset_link", forgetPassword);  
router.get("/reset_password/:token", verifyForgetPassword);
router.post("/reset_password/", changePassword);



 
module.exports = router;
