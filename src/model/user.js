const mongoose = require("mongoose");


const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: [true, "Please enter a email"],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Please enter a password"],
      minlength: 8,
    },
    verified: {
      type: Boolean,
      defaultValue: false
    },
    designation: String,
    phone: String,
    gender: String,
    organizationId: String,
    imageUrl: String,
    priviledge: [String],
  },
  {
    timestamps: true,
  }
);


module.exports = mongoose.model("User", userSchema);
