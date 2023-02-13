const express = require("express");
const {
  adminAuth,
  initiatorAuth,
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
} = require("../controller/initiateRequest/initiateRequest.controller");
const batchUpload = require("../controller/batchUpload");


// initiate request
router.post("/initiate", initiatorAuth, initiateRequest);

// get all request for initiator
router.get("/initiator", initiatorAuth, getAllInitiatorRequests);

// update request
router.put("/:id", authoriserAuth, updateRequest);

// bulk upload request
router.post("/upload", upload.single("file"), initiatorAuth, batchUpload);

// get all request for authorizer
router.get("/authorizer", authoriserAuth, getAllAuthorizerRequests);

// get all request for admin
router.get("/allrequests", adminAuth, getAllRequest);

// get request by id
router.get("/:id", authoriserAuth, getRequestById);


module.exports = router;
