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
  updateUserPrivilege,
  getUserProfileById,
  getAllAdmins,
  disableUser,
  enableUser,
  deleteAccount,
  editEmail,
  whiteListAccount,
  allwhiteListAccount,
  deleteWhitelistedAccounts
} = require("../controller/user/user.controller");
const {
  adminAuth,
  allUsersAuth,
  superUserAuth,
} = require("../middleware/auth");
const { validate, authSchemas } = require("../validations");

const router = express.Router();

//general route
router.get("/profile", allUsersAuth, getUserProfile);
router.get("/profile/:id", adminAuth, getUserProfileById);

router.put("/profile", adminAuth, updateUserProfile);
router.put("/userPrivilege", adminAuth, updateUserPrivilege);
router.post("/change-password", allUsersAuth, validate(authSchemas.changePassword,"body"), changePassword);
router.post("/secret-questions/create", createSecurityQuestions)

//admin routes
router.get("/allbranchusers", allUsersAuth, getOrganizationUsers);
router.get("/all", superUserAuth, getAllUsers);
router.get("/alladmins", superUserAuth, getAllAdmins);

router.delete("/delete_user", superUserAuth, deleteAnyUser);
router.delete("/delete_nonadmin", adminAuth, deleteNonAdminUsers);
router.patch("/disable/:id", superUserAuth, disableUser)
router.patch("/enable/:id", superUserAuth, enableUser)
router.delete("/deleteAccount/:id", superUserAuth, deleteAccount)

router.patch("/editEmail", superUserAuth, validate(authSchemas.updateEmail,"body"), editEmail)

router.post('/whiteListAccount', superUserAuth, whiteListAccount)
router.get('/all/whiteListedAccounts', superUserAuth, allwhiteListAccount)
router.delete('/remove/whiteListedAccounts', superUserAuth, deleteWhitelistedAccounts)

module.exports = router;

deleteNonAdminUsers;
