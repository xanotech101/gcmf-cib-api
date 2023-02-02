const express = require("express");
const {
  getOrganizationUsers,
  getUserProfile,
  changePassword,
  getAllPriviledges,
} = require("../controller/user/user.controller");
const { adminAuth, allUsersAuth, superUserAuth } = require("../middleware/auth");

const router = express.Router();

//general route
router.get("/profile", allUsersAuth, getUserProfile);
router.post("/change-password", allUsersAuth, changePassword);

//admin routes
router.get("/allbranchusers", adminAuth, getOrganizationUsers);
router.get("/priviledges", superUserAuth, getAllPriviledges);

module.exports = router;
