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
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationCode: Number,
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

userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
  return token;
};

module.exports = mongoose.model("User", userSchema);
