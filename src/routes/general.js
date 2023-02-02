const express = require("express");
const {
  adminAuth,
  initiatorAuth,
  allUsersAuth,

} = require("../middleware/auth");

const upload = require("../middleware/multer");
const router = express.Router();
const {
  initiateRequest,
  batchUpload,
  updateRequest,
} = require("../controller/general");


router.post("/request", initiatorAuth, initiateRequest);
router.post("/request/:id", initiatorAuth, updateRequest);
// router.post("/upload", upload.single("file"), batchUpload);
router.post("/upload", upload.single("file"), batchUpload);
// router.post("/upload", (req, res) => {
//   res.send("iii");
// });

module.exports = router;
