const express = require("express");
const router = express.Router();
const { registerUser, forgetPassword, changePassword, userLogin } = require("../controller/user");
const { verifyUser, getNewPassword } = require("../controller/emailServices");

router.post("/register", registerUser); //register a user
router.get("/register_confirmation/:token", verifyUser);  //send email after registration and verifies user
router.post("/send_password_reset_link", forgetPassword);  
router.get("/reset_password/:token", getNewPassword);
router.post("/reset_password", changePassword);
router.post("/login", userLogin);
router.post("/", (req, res) => res.send("Welcome to the user route"));


 
module.exports = router;
