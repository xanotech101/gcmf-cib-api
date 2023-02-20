const express = require("express");
const router = express.Router();
const {
  adminAuth,
  initiatorAuth,
  authoriserAuth,
  verifierAuth,
} = require("../middleware/auth");

const upload = require("../middleware/multer");

const {
  initiateRequest,
  declineRequest,
  approveRequest,
  getAllAuthoriserRequests,
  getAllRequest,
  getAllInitiatorRequests,
  getRequestById,
  verifierApprovalRequest,  
  verifierDeclineRequest,
} = require("../controller/initiateRequest/initiateRequest.controller");
const batchUpload = require("../controller/batchUpload");

// initiate request
router.post("/initiate", initiatorAuth, initiateRequest);

// get all request for initiator
router.get("/initiator", initiatorAuth, getAllInitiatorRequests);

// update request
router.put("/authoriser/approve/:id", authoriserAuth, approveRequest);
router.put("/authoriser/decline/:id", authoriserAuth, declineRequest);

router.put("verifier/decline/:id", verifierAuth, verifierApprovalRequest);
router.put("verifier/approve/:id", verifierAuth, verifierDeclineRequest);

// bulk upload request
router.post("/upload", upload.single("file"), initiatorAuth, batchUpload);

// get all request for authoriser
router.get("/authoriser", authoriserAuth, getAllAuthoriserRequests);

// get all request for admin
router.get("/allrequests", adminAuth, getAllRequest);

// get request by id
router.get("/:id", authoriserAuth, getRequestById);

module.exports = router;


