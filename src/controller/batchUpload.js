const multer = require("multer");
let csvToJson = require("convert-csv-to-json");
const fs = require("fs");
const excelToJson = require("convert-excel-to-json");



const batchUpload = async (req, res) => {
  console.log(req.file)
  try {
    let data;
    let excelDocs = ["xlsx", "xls"];
    let csvDocs = ["csv"];


    if (
      req.file == null ||
      req.file?.originalname == "undefined" ||
      req.file == undefined
    ) {
      return res.status(400).json({ message: "No file uploaded. Please upload a file" });
    }

    let fileExtension = req.file.originalname.split(".")[1];
    
    if (excelDocs.includes(fileExtension)) {
      data = excelToJson({
        sourceFile: req.file.path,
        header: {
          rows: 1,
        },
        columnToKey: {
          "*": "{{columnHeader}}",
        },
      });
    } else if (csvDocs.includes(fileExtension)) {
      data = csvToJson.fieldDelimiter(",").getJsonFromCsv(req.file.path);
    } else {
      return res.status(400).json({ message: "Invalid file type. Please upload a csv or excel file" });
    };

    fs.unlinkSync(req.file.path);
    res.status(200).json({ message: "File uploaded successfully", data });

    
    
    }catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = batchUpload;