const express = require("express");
const router = express.Router();
const {
  initiatorAuth,
  authoriserAuth,
  verifierAuth,
  allUsersAuth,
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
  authoriserApproveRequest,
  authoriserDeclineRequest,
  getAllTransferRequests,
  approveBulkRequest,
  authoriserBulkaprove
} = require("../controller/initiateRequest/initiateRequest.controller");
const {
  newBatchUpload,
  VerifyBatchUpload,
} = require("../controller/batchUpload");
const { Verify_Account } = require("../services/golan.service");
const {getReportAnalysis, getReportAnalysisForCooperateAccount, dashBoardAnalytics} = require("../controller/initiateRequest/report");

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
router.put("/verifier/approve/:id", verifierAuth, approveRequest);
router.put("/verifier/decline/:id", verifierAuth, declineRequest);
router.put("/authoriser/decline/:id", authoriserAuth,  authoriserDeclineRequest);
router.put("/authoriser/approve/:id", authoriserAuth, authoriserApproveRequest);

// bulk upload request

router.get("/analysis/backoffice/dashboard", allUsersAuth, dashBoardAnalytics)
router.get("/analysis/backoffice/:year", allUsersAuth, getReportAnalysis)
router.get("/analysis/account/:accountNumber/:year", allUsersAuth, getReportAnalysisForCooperateAccount)
router.get("/backoffice/transfer-requests/all", allUsersAuth, getAllTransferRequests)


// batch/bulk upload
router.post("/batchUpload", upload.single("file"), newBatchUpload);
router.post("/verify_batchUpload", initiatorAuth, upload.array("files"), Verify_Account, VerifyBatchUpload);
router.post("/bulk/verifier/approve", verifierAuth, approveBulkRequest);
router.post("/bulk/authoriser/approve", authoriserAuth, authoriserBulkaprove);


module.exports = router;


