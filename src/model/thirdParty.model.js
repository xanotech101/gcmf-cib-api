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
    bvnCount:{
      type: Number,
      default: 0
    }
  },
  {timestamps:true})
  
  const thirdPartyModel = mongoose.model('thirdparty', thirdPartyUser)
  module.exports = thirdPartyModel