const mongoose = require("mongoose")

const thirdPartyUser = new mongoose.Schema({
    organization_name: {
      type: String,
      required: true
    },
    requestCount: {
      type: Number,
      default: 0
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    updatedAt: {
      type: Date,
      default: Date.now()
    },
  })
  
  const thirdPartyModel = mongoose.model('thirdparty', thirdPartyUser)
  module.exports = thirdPartyModel