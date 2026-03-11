const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Privilege = require("./privilege.model");
const { toISOLocal } = require("../utils/utils");
const organization = require("./organization");
const account = require("./account");

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
    },
    organizationLabel: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "organzationLabel",
    },
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
      enum: ["system-admin", "super-admin", "admin", "user", "organizationLabelAdmin"],
    },
    disabled: {
      type: Boolean,
      default: false
    },
    verificationToken: String,
    
    // ==========================================
    // EXISTING: Secret Questions 2FA (keep as is)
    // ==========================================
    is2FAEnabled: {
      type: Boolean,
      default: false,
    },
    
    // ==========================================
    // NEW: Authenticator App MFA (separate field)
    // ==========================================
    isMFAEnabled: {
      type: Boolean,
      default: false,  // true = authenticator MFA is set up
    },
    mfaSecret: {
      type: String,    // base32 secret for TOTP
      default: null,
    },
    mfaBackupCodes: [{
      type: String,    // hashed backup codes
    }],
    // ==========================================
    
    secretQuestions: [
      {
        question: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SecretQuestion",
        },
        answer: String,
      }
    ],
    createdAt: { type: String },
    updatedAt: { type: String },
  }

);

// Set the createdAt and updatedAt values before saving the document
userSchema.pre("save", function (next) {
  const currentDate = toISOLocal();
  this.createdAt = currentDate;
  this.updatedAt = currentDate;
  next();
})

userSchema.methods.generateAuthToken = async function () {
  const privileges = (await Privilege.find({ _id: { $in: this.privileges } })) || [];
  const organization = await account.findOne({ _id: this.organizationId });

  const tokenPayload = {
    _id: this._id,
    organizationId: this.organizationId,
    privileges: privileges.map((privilege) => privilege.name),
    firstName: this.firstName,
  };

  if (organization && organization.organizationLabel) {
    tokenPayload.organizationLabel = organization.organizationLabel;
  }

  const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  return token;
};


userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.secrets;
  delete user.__v;
  // ==========================================
  // HIDE MFA SECRETS FROM API RESPONSES
  // ==========================================
  delete user.mfaSecret;
  delete user.mfaBackupCodes;
  // ==========================================
  return user;
};

module.exports = mongoose.model("User", userSchema);