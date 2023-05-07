var CronJob = require('cron').CronJob;
require("dotenv").config();
const connectDB = require('../config/db');
const InitiateRequest = require("../model/initiateRequest.model");
const bankOneService = require('../services/bankOne.service');

const transferRetryJob = new CronJob("*/15 * * * *", async () => {
  console.info('transfer retry job started')
  await connectDB(process.env.MONGO_URI, () => {
    console.info('connected to db for transfer retry job')
  });
  
  const cursor = await InitiateRequest.find({
    transferStatus: "disburse pending",
    retryCount: { $lt: 5 },
  }).cursor();

  cursor.on("data", async (transaction) => {
    const {transactionReference, type, updatedAt, amount} = transaction
    try {
      const response = await bankOneService.transactionStatus(transactionReference, type, updatedAt, amount, process.env.AUTHTOKEN)
      if(response.IsSuccessful && response.Status === 'Successful') {
        transaction.transferStatus = "successful"
        transaction.retryCount = transaction.retryCount + 1
        transaction.meta = {
          ...(transaction.meta ?? {}),
          Status: response.Status,
          IsSuccessful: response.IsSuccessful,
          ResponseCode: response.ResponseCode,
          ResponseMessage: response.ResponseMessage,
          ResponseDescription: response.ResponseDescription,
          StatusDescription: response.Status,
          ResponseStatus: response.ResponseStatus
        }
        await transaction.save()
      }
      if(response.IsSuccessful && response.Status === 'Failed') {
        transaction.transferStatus = "failed"
        transaction.retryCount = transaction.retryCount + 1
        transaction.meta = {
          ...(transaction.meta ?? {}),
          Status: response.Status,
          IsSuccessful: response.IsSuccessful,
          ResponseMessage: response.ResponseMessage,
          ResponseCode: response.ResponseCode,
          ResponseDescription: response.ResponseDescription,
          StatusDescription: response.Status,
          ResponseStatus: response.ResponseStatus,
        }
        await transaction.save()
      }
    }catch(error) {
      console.log("🚀 ~ file: transferRetryJob.js:22 ~ cursor.on ~ error:", error, transaction._id)
    }
  }).on('close', () => {
    console.info('transfer retry job closed')
  })
});

transferRetryJob.start();