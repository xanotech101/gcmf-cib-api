const mongoose = require('mongoose')

const organizationLabel = new mongoose.Schema({
    label:{
        type: String,
        required:true
    },
    createdAt: {
        type: Date,
        default: Date.now()
      },
      code:String,
      updatedAt: {
        type: Date,
        default: Date.now()
      },
})

module.exports= mongoose.model('organzationLabel',organizationLabel) 
