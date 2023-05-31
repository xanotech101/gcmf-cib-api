const mongoose = require('mongoose')
const { toISOLocal } = require('../utils/utils')

const organizationLabel = new mongoose.Schema({
    label:{
        type: String,
        required:true
    },
    code:String,
    createdAt: { type: String },
  updatedAt: { type: String },
})

// Set the createdAt and updatedAt values before saving the document
organizationLabel.pre("save", function (next) {
  const currentDate = toISOLocal();
  this.createdAt = currentDate;
  this.updatedAt = currentDate;
  next();
})

module.exports= mongoose.model('organzationLabel',organizationLabel) 
