const mongoose = require('mongoose')
const { toISOLocal } = require('../utils/utils')

const organizationLabel = new mongoose.Schema({
    label:{
        type: String,
        required:true
    },
    code:String,
    createdAt: { type: String, default: toISOLocal(new Date()) },
  updatedAt: { type: String, default: toISOLocal(new Date()) },
})

module.exports= mongoose.model('organzationLabel',organizationLabel) 
