const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Privilege = require("./privilege.model");
const { toISOLocal } = require("../utils/utils");

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
    phone: String,
    gender: String,
    organizationId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Account",
        }
      ,
    imageUrl: String,
    privileges: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Privilege",
      },
    ],

    role: {
      type: String,
      required: true,
      enum: ["system-admin", "super-admin", "admin", "user"],
    },
    verificationToken: String,
    is2FAEnabled: {
      type: Boolean,
      default: false,
    },
    secretQuestions: [
      {
        question: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SecretQuestion",
        },
        answer: String,
      }
    ],
    createdAt: { type: String, default: toISOLocal(new Date()) },
    updatedAt: { type: String, default: toISOLocal(new Date()) },
  }

);

userSchema.methods.generateAuthToken = async function () {
  const privileges =
    (await Privilege.find({ _id: { $in: this.privileges } })) || [];

  const token = jwt.sign(
    {
      _id: this._id,
      organizationId: this.organizationId,
      privileges: privileges.map((privilege) => privilege.name),
      firstName: this.firstName,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    }
  );
  // TODO: Encrypt token
  return token;
};

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.secrets;
  delete user.__v;
  return user;
};

module.exports = mongoose.model("User", userSchema);

