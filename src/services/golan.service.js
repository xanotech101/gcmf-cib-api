let csvToJson = require("convert-csv-to-json");
const fs = require("fs");
const excelToJson = require("convert-excel-to-json");
const { default: axios } = require("axios");
const { emit } = require("process");
const emitter = require("../utils/emitters");
const csv = require('csv-parser')

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
                data = csvToJson.fieldDelimiter(',').getJsonFromCsv(file.path);
                formattedData = formattedData.concat(data.map((obj) => ({
                    customerName: obj.customerName ? obj.customerName.trim() : '',
                    amount: obj.amount ? parseInt(obj.amount.trim()) : '',
                    bankName: obj.bankName ? obj.bankName.trim() : '',
                    accountNumber: obj.accountNumber ? obj.accountNumber.trim() : '',
                    accountName: obj.accountName ? obj.accountName.trim() : '',
                    banktype: 'inter-bank',
                    accountType: obj.accountType ? obj.accountType.trim() : '',
                    bankCode: obj.bankCode ? obj.bankCode.trim() : '',
                })));
            } else {
                return res.status(400).json({
                    message: "Invalid file type. Please upload a csv or excel file",
                    status: "failed",
                });
            }

            fs.unlinkSync(file.path);
        }

        // Filter the formattedData array to include only objects that have non-empty values for accountType, bankCode, and banktype
        formattedData = formattedData.filter((obj) => obj.accountType && obj.accountType.trim() !== '' && obj.bankCode && obj.bankCode.trim() !== '' && obj.banktype && obj.banktype.trim() !== '');
       
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
        return res
            .status(500)
            .json({ message: error.message });
    }
}

function sendToGolang(data) {

    //http://54.147.219.106:3003/api/verify_account
    try {
        axios.post(`http://35.169.118.252:3003/api/verify_account`, data, {timeout:30000})
            .then((response) => {
                emitter.emit('results', response.data)
            }).catch((error) => {
                console.log(error)
            })

    } catch (error) {
        console.log(error)
    }
}
module.exports = { Verify_Account };
