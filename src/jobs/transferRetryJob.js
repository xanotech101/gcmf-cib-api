var CronJob = require('cron').CronJob;
require("dotenv").config();
const connectDB = require('../config/db');
const InitiateRequest = require("../model/initiateRequest.model");
const mongoose = require("mongoose");

const transferRetryJob = new CronJob("*/1 * * * *", async () => {
  connectDB(process.env.MONGO_URI, () => {
    console.info('connected to db for transfer retry job')
  });
  const cursor = await InitiateRequest.find({
    status: "pending",
  }).cursor();

  cursor.on("data", async (transaction) => {
    transaction.status = "declined";
    await transaction.save();
  }).on ("error", (error) => {
    console.log(error);
  }).on("close", () => {
    console.log("done");
  }).on("end", () => {
    mongoose.connection.close();
  });
})

transferRetryJob.start();