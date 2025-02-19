const mongoose = require("mongoose");
const { toISOLocal } = require("../utils/utils");


const thirdPartyUser = new mongoose.Schema({
  organization_name: {
    type: String,
    required: true
  },
  key:{
    type: String,
    required: true
  },
  createdAt: { type: String},
  updatedAt: { type: String},
}
);

// Set the createdAt and updatedAt values before saving the document
thirdPartyUser.pre("save", function (next) {
  const currentDate = toISOLocal();
  this.createdAt = currentDate;
  this.updatedAt = currentDate;
  next();
})


const thirdPartyModel = mongoose.model('thirdparty', thirdPartyUser)
module.exports = thirdPartyModel