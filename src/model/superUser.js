const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const superUserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    email: {
      type: String,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      minlength: 8,
    },
    isVerified: {
      type: Boolean,
      default: false,
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

superUserSchema.methods.generateAuthToken = function () {
  const token = jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
  return token;
};

module.exports = mongoose.model("SuperUser", superUserSchema);
