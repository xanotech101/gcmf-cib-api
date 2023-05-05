var CronJob = require('cron').CronJob;
require("dotenv").config();
const connectDB = require('../config/db');
const InitiateRequest = require("../model/initiateRequest.model");
const mongoose = require("mongoose");
const bankOneService = require('../services/bankOne.service');

const transferRetryJob = new CronJob("*/1 * * * *", async () => {
  connectDB(process.env.MONGO_URI, () => {
    console.info('connected to db for transfer retry job')
  });
  const cursor = await InitiateRequest.find({
    status: "disburse pending",
    retryCount: { $lt: 5 },
  }).cursor();

  cursor.on("data", async (transaction) => {
    const {transactionReference, type, updatedAt, amount} = transaction
    try {
      const response = await bankOneService.transactionStatus(transactionReference, type, updatedAt, amount)
      console.log("🚀 ~ file: transferRetryJob.js:20 ~ cursor.on ~ response:", response)
    }catch(error) {
      console.log("🚀 ~ file: transferRetryJob.js:22 ~ cursor.on ~ error:", error)
    }
  }).on ("error", (error) => {
    console.log(error);
  }).on("close", () => {
    console.log("done");
  }).on("end", () => {
    mongoose.connection.close();
  });
})

transferRetryJob.start();