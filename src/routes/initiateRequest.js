const express = require("express");
const router = express.Router();
const {
  initiatorAuth,
  authoriserAuth,
  verifierAuth,
  allUsersAuth,
  superUserAuth
} = require("../middleware/auth");

const upload = require("../middleware/multer");

const {
  initiateRequest,
  declineRequest,
  approveRequest,
  getAllAssignedRequests,
  getAllRequestPerOrganization,
  getAllInitiatorRequests,
  getRequestById,
  verifierApproveRequest,  
  verifierDeclineRequest,
  getAwaitingVerificationRequest,
  getRequestSentToBankOne
} = require("../controller/initiateRequest/initiateRequest.controller");
const {batchUpload, VerifyBatchUpload} = require("../controller/batchUpload");
const { Verify_Account } = require("../services/golan.service");
const {getReportAnalysis, getReportAnalysisForCooperateAccount} = require("../controller/initiateRequest/report");

// initiate request
router.post("/initiate", initiatorAuth, initiateRequest);

// get all request for initiator
router.get("/initiator", initiatorAuth, getAllInitiatorRequests);

// get all assigned requests
router.get("/assigned", allUsersAuth, getAllAssignedRequests);

// get all request per organization
router.get("/all", allUsersAuth, getAllRequestPerOrganization);

// get request by id
router.get("/:id", allUsersAuth, getRequestById);

// update request
router.put("/authoriser/approve/:id", authoriserAuth, approveRequest);
router.put("/authoriser/decline/:id", authoriserAuth, declineRequest);
router.put("/verifier/decline/:id", verifierAuth,  verifierDeclineRequest);
router.put("/verifier/approve/:id", verifierAuth, verifierApproveRequest);

// bulk upload request
// router.post("/upload", upload.single("file"), initiatorAuth, batchUpload);
router.post("/verify_batchUpload", initiatorAuth, upload.array("files"), Verify_Account, VerifyBatchUpload);


router.get("/analysis/backoffice", allUsersAuth, getReportAnalysis)
router.get("/analysis/account/:accountNumber/:year", allUsersAuth, getReportAnalysisForCooperateAccount)
router.get("/backoffice/awaiting-approval", allUsersAuth, getAwaitingVerificationRequest)
router.get("/backoffice/transfers", allUsersAuth, getRequestSentToBankOne)

module.exports = router;


