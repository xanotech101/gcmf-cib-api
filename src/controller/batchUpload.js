const multer = require('multer');
const fs = require('fs');

// const uploader = multer({
//     storage: multer.diskStorage({
//         destination: (req, file, cb) => {
//             const dir = './uploads';
//             if (!fs.existsSync(dir)) {
//                 fs.mkdirSync(dir);
//             }
//             cb(null, dir);
//         }
//     })
// });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "/tmp/my-uploads");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix);
  },
});

const upload = multer({ storage: storage });