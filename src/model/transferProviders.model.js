const mongoose = require("mongoose");

const transferProvider = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
});

transferProvider.pre("save", async function (next) {
  if (this.isModified("isActive") && this.isActive) {
    await mongoose.model("transferProvider").updateMany(
      { isActive: true, _id: { $ne: this._id } },
      { $set: { isActive: false } }
    );
  }
  next();
});

module.exports = mongoose.model("transferProvider", transferProvider);
