const express = require("express");
const {
  superUserAuth,
  adminAuth,
  initiatorAuth,
  verifierAuth,
  allUsersAuth,

} = require("../middleware/auth");

const upload = require("../middleware/multer");
const router = express.Router();
const {
  getUsersByID,
  getUsersByOrgID,
  initiateRequest,
  batchUpload,
  updateRequest,
} = require("../controller/general");


router.get("/profile", allUsersAuth, getUsersByID);
router.get("/allbranchusers", adminAuth, getUsersByOrgID);
router.post("/request", initiatorAuth, initiateRequest);
router.post("/request/:id", initiatorAuth, updateRequest);
// router.post("/upload", upload.single("file"), batchUpload);
router.post("/upload", upload.single("file"), batchUpload);
// router.post("/upload", (req, res) => {
//   res.send("iii");
// });

module.exports = router;
