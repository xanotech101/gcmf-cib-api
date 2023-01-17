const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: { type: String, required: true },
    designation: String,
  phone: String,
gender: String,
organizationId: String,
image: String,
privilege: [String],
});

module.exports = mongoose.model("User", userSchema);
