const mongoose = require("mongoose");
const { toISOLocal } = require("../utils/utils");

const privilegeSchema = new mongoose.Schema(
  {
    name: String,
    _id: mongoose.Schema.Types.ObjectId,
    createdAt: { type: String, default: toISOLocal(new Date()) },
  updatedAt: { type: String, default: toISOLocal(new Date()) },
    
  }
);

module.exports = mongoose.model("Privilege", privilegeSchema);
