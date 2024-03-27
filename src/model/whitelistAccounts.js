const mongoose = require("mongoose");
const { toISOLocal } = require("../utils/utils");

const whiteListSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    account_number: {
      type:String,
      required:true
    }
   },

);

whiteListSchema.pre("save", function (next) {
  const currentDate = toISOLocal();
  this.createdAt = currentDate;
  this.updatedAt = currentDate;
  next();
})

module.exports = mongoose.model("whitelistedAccounts", whiteListSchema);
