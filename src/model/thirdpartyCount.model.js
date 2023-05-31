const mongoose = require("mongoose");
const { toISOLocal } = require("../utils/utils");


const thirdPartyCount = new mongoose.Schema({
  userid: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref:'thirdparty'
  },
  requestType:String,
  createdAt: { type: String },
  updatedAt: { type: String },
}
);

// Set the createdAt and updatedAt values before saving the document
thirdPartyCount.pre("save", function (next) {
  const currentDate = toISOLocal();
  this.createdAt = currentDate;
  this.updatedAt = currentDate;
  next();
})

const thirdPartyRequestCOuntModel = mongoose.model('thirdpartyRequest_count', thirdPartyCount)
module.exports = thirdPartyRequestCOuntModel