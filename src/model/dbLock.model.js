const mongoose = require("mongoose");

const dbLockSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  lockedAt: { type: Date, required: true },
  expiresAt: {
    type: Date,
    default: function () {
      return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
    },
  },
});

// delete the lock after it as expired
dbLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Lock", dbLockSchema);
