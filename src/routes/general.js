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
getMyRequests,
  getAllRequest,
  getRequestById,
} = require("../controller/general");
const batchUpload = require("../controller/batchUpload");
s
router.get("/request/:id", authoriserAuth, getRequestById);
router.post("/request", initiatorAuth, initiateRequest);
router.get("/myrequests", initiatorAuth, getMyRequests);
router.put("/request/:id", authoriserAuth, updateRequest);
router.post("/upload", upload.single("file"), initiatorAuth, batchUpload);
router.get("/allrequests", adminAuth, getAllRequest);




getSingleRequestByID;

module.exports = router;
