const express = require("express");
const {
  getOrganizationUsers,
  getUserProfile,
  changePassword,
  getAllPriviledges,
  updateUserProfile,
  getAllUsers,
} = require("../controller/user/user.controller");
const {
  adminAuth,
  allUsersAuth,
  superUserAuth,
} = require("../middleware/auth");

const router = express.Router();

//general route
router.get("/profile", allUsersAuth, getUserProfile);
router.put("/profile", allUsersAuth, updateUserProfile);
router.post("/change-password", allUsersAuth, changePassword);

//admin routes
router.get("/allbranchusers", adminAuth, getOrganizationUsers);
router.get("/priviledges", superUserAuth, getAllPriviledges);
router.get("/all", adminAuth, getAllUsers);
// router.post("/priviledges", superUserAuth, createPriviledges);
module.exports = router;
 