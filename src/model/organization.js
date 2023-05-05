const mongoose = require('mongoose')

const organizationLabel = new mongoose.Schema({
    label:{
        type: String,
        required:true
    },
    code:{
      type: String,
        required:true
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

module.exports= mongoose.model('organzationLabel',organizationLabel) 
