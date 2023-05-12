const mongoose = require("mongoose");
const { toISOLocal } = require("../utils/utils");


const thirdPartyUser = new mongoose.Schema({
  organization_name: {
    type: String,
    required: true
  },
  requestCount: {
    type: Number,
    default: 0
  },
  bvnCount: {
    type: Number,
    default: 0
  },

  createdAt: { type: String, default: toISOLocal(new Date()) },
  updatedAt: { type: String, default: toISOLocal(new Date()) },
}
);


const thirdPartyModel = mongoose.model('thirdparty', thirdPartyUser)
module.exports = thirdPartyModel