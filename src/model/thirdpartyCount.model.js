const mongoose = require("mongoose");
const { toISOLocal } = require("../utils/utils");


const thirdPartyCount = new mongoose.Schema({
  userid: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref:'thirdparty'
  },
  requestType:String,
  createdAt: { type: String, default: toISOLocal(new Date()) },
  updatedAt: { type: String, default: toISOLocal(new Date()) },
}
);


const thirdPartyRequestCOuntModel = mongoose.model('thirdpartyRequest_count', thirdPartyCount)
module.exports = thirdPartyRequestCOuntModel