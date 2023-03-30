let csvToJson = require("convert-csv-to-json");
const fs = require("fs");
const excelToJson = require("convert-excel-to-json");
const { default: axios } = require("axios");
const { emit } = require("process");
const emitter = require("../utils/emitters");

async function Verify_Account(req, res, next) {
    try {
        // Extract the data from the request body
        const excelDocs = ["xlsx", "xls"];
        const csvDocs = ["csv"];

        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({
                message: "No files uploaded. Please upload at least one file",
                status: "failed",
            });
        }

        let formattedData = [];

        for (let i = 0; i < req.files.length; i++) {
            let file = req.files[i];
            let fileExtension = file.originalname.split(".")[1];
            let data;

            if (excelDocs.includes(fileExtension)) {
                data = excelToJson({
                    sourceFile: file.path,
                    header: {
                        rows: 1,
                    },
                    columnToKey: {
                        "*": "{{columnHeader}}",
                    },
                });

                let result;
                for (let i in data) {
                    result = i;
                    break;
                }
                formattedData = formattedData.concat(data[result]);
            } else if (csvDocs.includes(fileExtension)) {
                data = csvToJson.getJsonFromCsv(file.path);
                formattedData = formattedData.concat(data);
            } else {
                return res.status(400).json({
                    message: "Invalid file type. Please upload a csv or excel file",
                    status: "failed",
                });
            }

            fs.unlinkSync(file.path);
        }

         // Convert values to strings
         formattedData = formattedData.map(obj => {
            for (const prop in obj) {
                if (Number.isInteger(obj[prop])) {
                    obj[prop] = obj[prop].toString();
                }
            }
            return obj;
        });
        // Send the data to Kafka
        sendToGolang(formattedData);

        // Call the next middleware function
        next();
    } catch (error) {
        console.log(error)
        return res
            .status(500)
            .json({ message: error.message });
    }
}



function sendToGolang(data) {
 
    try {
        axios.post(`http://localhost:1000/api/verify_account`, data)
            .then((response) => {
                emitter.emit('results',response.data)
            }).catch((error) => {
                console.log(error)
            })

    } catch (error) {
        console.log(error)
    }
}
module.exports = { Verify_Account };
