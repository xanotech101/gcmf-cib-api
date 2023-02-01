const express = require("express");
const {
  superUserAuth,
  adminAuth,
  initiatorAuth,
  verifierAuth,
  allUsersAuth,
} = require("../middleware/auth");
const router = express.Router();
const {
  getUsersByID,
  getUsersByOrgID,
  initiateRequest,
  batchUpload,
  updateRequest,
} = require("../controller/general");
const multer = require("multer");
// const { verifyUser, getNewPassword } = require("../controller/emailServices");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "../files");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.originalname + "-" + uniqueSuffix);
  },
});

const upload = multer({ storage: storage });

router.get("/profile", allUsersAuth, getUsersByID);
router.get("/allbranchusers", adminAuth, getUsersByOrgID);
router.post("/request", initiatorAuth, initiateRequest);
router.post("/request/:id", initiatorAuth, updateRequest);
router.post("/upload", upload.single("file"), (req, res) => {
  console.log("check", req.file);
});

module.exports = router;
