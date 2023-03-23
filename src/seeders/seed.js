
require("dotenv").config();
const mongoose = require("mongoose");
const seedPrivileges = require("./privilege.seed");
const seedSecretQuestions = require("./secretQuestions.seeds");

mongoose
  .set("strictQuery", false)
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected for seeding");
  }).catch(() => {
    console.log("MongoDB connection failed");
  })

const seedDb = async () => {
  await seedPrivileges();
  await seedSecretQuestions();
};

seedDb().then(() => {
  mongoose.connection.close();
});


module.exports = seedDb;