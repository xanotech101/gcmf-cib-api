const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { string } = require("joi");


const userSchema = new mongoose.Schema(
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
    privileges: [String],
    role: {
      type: String,
      required: true,
      enum: ['super-admin', 'admin', 'user']
    },
    token : String,
  },
  {
    timestamps: true,
  }
);

userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    {
      _id: this._id,
      organizationId: this.organizationId,
      privileges: this.privileges,
      firstName: this.firstName,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    }
  );
  return token;
};

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model("User", userSchema);
