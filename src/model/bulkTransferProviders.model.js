const mongoose = require("mongoose");

const bulkTransferProvider = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
});

bulkTransferProvider.pre("save", async function (next) {
  if (this.isModified("isActive") && this.isActive) {
    await mongoose.model("bulkTransferProvider").updateMany(
      { isActive: true, _id: { $ne: this._id } },
      { $set: { isActive: false } }
    );
  }
  next();
});

module.exports = mongoose.model("bulkTransferProvider", bulkTransferProvider);
