const mongoose = require("mongoose");
const { toISOLocal } = require("../utils/utils");

const privilegeSchema = new mongoose.Schema(
  {
    name: String,
    createdAt: { type: String },
    updatedAt: { type: String },

  }
);

// Set the createdAt and updatedAt values before saving the document
privilegeSchema.pre("save", function (next) {
  const currentDate = toISOLocal();
  this.createdAt = currentDate;
  this.updatedAt = currentDate;
  next();
})

module.exports = mongoose.model("Privilege", privilegeSchema);
