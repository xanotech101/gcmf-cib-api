import { Request } from "express";
import multer, { FileFilterCallback } from "multer";
import { throwError } from "../helpers";
import path from "path";
import fs from "fs";

function fileFilter(
  req,
  file,
  cb
) {
  switch (req.path) {
    case "/admin/create":
    //   if (["image/jpeg", "image/png", "images/jpg"].includes(file.mimetype)) {
            if (
              ["image/jpeg", "image/png", "images/jpg"].includes(file.mimetype)
            ) {
              cb(null, true);
            } else {
              throwError(400, "Unsupported file format");
            }
      break;
    default:
      cb(null, false);
      break;
  }
}


export const upload = multer({

  fileFilter,
//   limits: {
//     fileSize: 1000000,
//   },
});
