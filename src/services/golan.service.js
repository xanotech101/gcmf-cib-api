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

        if (!req.body.originatorAccountNumber){
            return res.status(400).json({
                message: "originator account is required!",
                status: "failed",
            });
        }
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({
                message: "No files uploaded. Please upload at least one file",
                status: "failed",
            });
        }

        let formattedData = [];
        let transformedData = []

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
                transformedData = formattedData.map(obj =>
                    Object.fromEntries(
                        Object.entries(obj).map(([key, value]) => [
                            key.replace(/ /g, ''),
                            value
                        ])
                    )
                );


                formattedData = transformedData.map((obj) => ({
                    payerAccountNumber:req.body.originatorAccountNumber,
                    amount: obj.AMOUNT,
                    bankName: obj.BANKNAME ? obj.BANKNAME.trim() : '',
                    accountNumber: obj.ACCOUNTNUMBER ? obj.ACCOUNTNUMBER.trim() : '',
                    banktype: obj.TYPE && obj.TYPE.trim() === 'GMFB' ? 'inter-bank' : 'intra-bank',
                    accountType: obj.ACCOUNTTYPE ? obj.ACCOUNTTYPE.trim() : '',
                    bankCode: obj.BANKCODE ? obj.BANKCODE.trim() : '',
                    narration: obj.NARRATION ? obj.NARRATION.trim() : '',
                }));

            } else if (csvDocs.includes(fileExtension)) {
                data = csvToJson.fieldDelimiter(',').getJsonFromCsv(file.path);
                formattedData = formattedData.concat(data.map((obj) => ({
                    payerAccountNumber:req.body.originatorAccountNumber,
                    amount: obj.AMOUNT ? parseInt(obj.AMOUNT.trim()) : '',
                    bankName: obj.BANKNAME ? obj.BANKNAME.trim() : '',
                    accountNumber: obj.ACCOUNTNUMBER ? obj.ACCOUNTNUMBER.trim() : '',
                    banktype: obj.TYPE && obj.TYPE.trim() === 'GMFB' ? 'inter-bank' : 'intra-bank',
                    accountType: obj.ACCOUNTTYPE ? obj.ACCOUNTTYPE.trim() : '',
                    bankCode: obj.BANKCODE ? obj.BANKCODE.trim() : '',
                    narration: obj.NARRATION ? obj.NARRATION.trim() : '',
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
        formattedData = formattedData.filter((obj) => obj.accountNumber && obj.accountNumber.trim() !== '' && obj.bankCode && obj.bankCode.trim() !== '');

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

async function sendToGolang(data) {
    const batchSize = 30; // Number of elements to send in each batch
    const responses = []; // Array to store all the responses
    const filteredResponse = []
  
    try {
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
  
        try {
          const response = await axios.post('http://35.169.118.252:3003/api/verify_account', batch);
          responses.push(response.data);
          console.log(`Batch ${i + 1}-${i + batchSize} sent successfully. ${response.data}`);
        } catch (error) {
          console.error(`Error sending batch ${i + 1}-${i + batchSize}:`, error);
        }
      }
  
      // All requests have been sent
      if(responses.length > 0){
        responses.map((item)=>{
            filteredResponse.push(item.data)
        })
      }
      
      const mergedArray = [].concat(...filteredResponse)
      emitter.emit('results', mergedArray);
    } catch (error) {
      console.error('Error sending data:', error);
    }
  }
module.exports = { Verify_Account };
