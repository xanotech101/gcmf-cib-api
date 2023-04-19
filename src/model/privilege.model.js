const mongoose = require("mongoose");

const privilegeSchema = new mongoose.Schema(
  {
    name: String,
    _id: mongoose.Schema.Types.ObjectId,
    createdAt: {
      type: Date,
      default: Date.now()
    },
    updatedAt: {
      type: Date,
      default: Date.now()
    },
    
  }
);

module.exports = mongoose.model("Privilege", privilegeSchema);
