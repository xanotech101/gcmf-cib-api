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
  getAllAuthorizerRequests,
  getAllRequest,
  getAllInitiatorRequests,
  getRequestById,
} = require("../controller/general");
const batchUpload = require("../controller/batchUpload");
router.get("/request/:id", authoriserAuth, getRequestById);
router.post("/request", initiatorAuth, initiateRequest);
router.get("/myrequests/", initiatorAuth, getAllInitiatorRequests);
router.put("/request/:id", authoriserAuth, updateRequest);
router.post("/upload", upload.single("file"), initiatorAuth, batchUpload);
router.get("/myrequests/authoriser", authoriserAuth, getAllAuthorizerRequests);
router.get("/allrequests", adminAuth, getAllRequest);


module.exports = router;
