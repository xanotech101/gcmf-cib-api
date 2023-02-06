const express = require("express");
const {
  adminAuth,
  initiatorAuth,
  allUsersAuth,
  authoriserAuth,
} = require("../middleware/auth");

const upload = require("../middleware/multer");
const router = express.Router();
const {
  initiateRequest,
  updateRequest,
  getAllRequestByAuthorisersId,
  getAllRequest,
} = require("../controller/general");
const batchUpload = require("../controller/batchUpload");

router.post("/request", initiatorAuth, initiateRequest);
router.post("/request/:id", initiatorAuth, updateRequest);
router.post("/upload", upload.single("file"), initiatorAuth, batchUpload);
router.get("/myrequests", authoriserAuth, getAllRequestByAuthorisersId);
router.get("/allrequests", adminAuth, getAllRequest);

module.exports = router;
