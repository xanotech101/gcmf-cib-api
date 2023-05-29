const express = require("express");
const {
  getOrganizationUsers,
  getUserProfile,
  changePassword,
  updateUserProfile,
  getAllUsers,
  deleteNonAdminUsers,
  deleteAnyUser,
  createSecurityQuestions,
  updateUserPriviledge,
  getUserProfileById,
  getAllAdmins,
  DeleteAccount
} = require("../controller/user/user.controller");
const {
  adminAuth,
  allUsersAuth,
  superUserAuth,
} = require("../middleware/auth");

const router = express.Router();

//general route
router.get("/profile", allUsersAuth, getUserProfile);
router.get("/profile/:id", adminAuth, getUserProfileById);

router.put("/profile", adminAuth, updateUserProfile);
router.put("/userPrivilege", adminAuth, updateUserPriviledge);
router.post("/change-password", allUsersAuth, changePassword);
router.post("/secret-questions/create", createSecurityQuestions)

//admin routes
router.get("/allbranchusers", allUsersAuth, getOrganizationUsers);
router.get("/all", superUserAuth, getAllUsers);
router.get("/alladmins", superUserAuth, getAllAdmins);

router.delete("/delete_user", superUserAuth, deleteAnyUser);
router.delete("/delete_nonadmin", adminAuth, deleteNonAdminUsers);
// router.post("/priviledges", superUserAuth, createPriviledges);

router.delete("/deleteAccount/:id",superUserAuth,DeleteAccount )
module.exports = router;

deleteNonAdminUsers;
