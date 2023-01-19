const express = require("express");
const router = express.Router();

const { registerUser, forgetPassword, changePassword } = require("../controller/user");
const { verifyUser, verifyForgetPassword } = require("../controller/emailServices");

router.post("/register", registerUser);
router.get("/register_confirmation/:token", verifyUser);
router.post("/password_confirmation", forgetPassword);
router.get("/forget_password/:token", verifyForgetPassword);
router.post("/change_password", changePassword);



 
module.exports = router;
