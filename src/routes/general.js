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
} = require("../controller/general");
const   batchUpload = require('../controller/batchUpload');

router.post("/request", initiatorAuth, initiateRequest);
router.post("/request/:id", initiatorAuth, updateRequest);
// router.post("/upload", upload.single("file"), batchUpload);
router.post("/upload", upload.single("file"), initiatorAuth, batchUpload);
// router.post("/upload", (req, res) => {
//   res.send("iii");
// });
router.get("/allrequest", authoriserAuth, getAllRequestByAuthorisersId);


module.exports = router;
