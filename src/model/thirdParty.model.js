const mongoose = require("mongoose");
const { toISOLocal } = require("../utils/utils");


const thirdPartyUser = new mongoose.Schema({
  organization_name: {
    type: String,
    required: true
  },
  createdAt: { type: String, default: toISOLocal(new Date()) },
  updatedAt: { type: String, default: toISOLocal(new Date()) },
}
);


const thirdPartyModel = mongoose.model('thirdparty', thirdPartyUser)
module.exports = thirdPartyModel