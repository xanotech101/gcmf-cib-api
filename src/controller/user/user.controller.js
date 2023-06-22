const User = require("../../model/user.model");
const bcrypt = require("bcrypt");
const { PER_PAGE } = require("../../utils/constants");
const mongoose = require("mongoose");
const Privilege = require("../../model/privilege.model");
const Mandate = require("../../model/mandate.model");
const Account = require("../../model/account");
const { auditTrailService, userService } = require("../../services");
const { getDateAndTime } = require("../../utils/utils");
const otpModel = require("../../model/otp.model");

const getOrganizationUsers = async (req, res) => {
  try {
    const { perPage, page, search } = req.query;
    const { organizationId } = req.user;

    const id = req.query?.branchId ?? organizationId;

    const options = {
      page: page || 1,
      limit: perPage || PER_PAGE,
      sort: { _id: -1 },
    };

    const { privilege, withPagination } = req.query;

    const checkPrivilege = await Privilege.findOne({ name: privilege });

    const filter = {
      organizationId: mongoose.Types.ObjectId(id),
    };


    if (search) {
      const trimmedSearch = search.trim();
      filter.$or = [
        { firstName: { $regex: new RegExp(trimmedSearch, "i") } },
        { lastName: { $regex: new RegExp(trimmedSearch, "i") } },
        { email: { $regex: new RegExp(trimmedSearch, "i") } },
        {
          $expr: {
            $regexMatch: {
              input: { $concat: ["$firstName", " ", "$lastName"] },
              regex: new RegExp(trimmedSearch, "i"),
            },
          },
        },
      ];
    }

    if (withPagination === "true") {
      const totalCount = await User.countDocuments(filter);

      const users = await User.find(filter)
        .sort(options.sort)
        .skip((options.page - 1) * options.limit)
        .limit(options.limit)
        .select(
          "firstName lastName email phone gender role privileges organizationId isVerified disabled"
        )
        .populate({ path: "privileges", select: "name" })
        .populate({ path: "organizationId", select: "_id" });

      const meta = {
        totalCount,
        page: options.page,
        perPage: options.limit,
      };

      return res.status(200).json({
        message: "Successfully fetched user",
        data: {
          users,
          meta,
        },
      });
    }

    if (checkPrivilege) {
      filter.privileges = { $in: [mongoose.Types.ObjectId(checkPrivilege._id)] };
    }

    const users = await User.find(filter)
      .sort({ _id: -1 })
      .select(
        "firstName lastName email phone gender role privileges organizationId isVerified disabled"
      )
      .populate({ path: "privileges", select: "name" });

    if (users.length === 0) {
      return res.status(404).json({
        message: "User not found",
        data: null,
        status: "failed",
      });
    }

    return res.status(200).json({
      message: "Successfully fetched user",
      data: users,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error.message,
      status: "failed",
    });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "privileges organizationId"
    );
    res.status(200).json({
      message: "Successfully fetched user",
      data: { user },
      status: "success",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error.message,
      data: null,
      status: "failed",
    });
  }
};

const getUserProfileById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("organizationId");
    res.status(200).json({
      message: "Successfully fetched user",
      data: { user },
      status: "success",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error.message,
      data: null,
      status: "failed",
    });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.body.id);

    const { firstName, lastName, phone, imageUrl } = req.body;

    user.firstName = firstName ?? user.firstName;
    user.lastName = lastName ?? user.lastName;
    user.phone = phone ?? user.phone;
    user.imageUrl = imageUrl ?? user.imageUrl;

    console.log("user", user);

    await user.save();

    res.status(200).json({
      message: "Successfully updated your profile",
      data: { user },
      status: "success",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error.message,
      data: null,
      status: "failed",
    });
  }
};

const updateUserPriviledge = async (req, res) => {
  try {
    const { privileges, id } = req.body;
    const user = await User.findById(id);
    user.privileges = privileges;
    await user.save();
    res.status(200).json({
      message: "Successfully updated",
      data: { user },
      status: "success",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error.message,
      data: null,
      status: "failed",
    });
  }
};

const changePassword = async (req, res) => {
  const { _id } = req.user;
  try {
    const validateChangePassword = (user) => (payload) =>
      user.validate(payload, { abortEarly: false });

    const { error } = validateChangePassword(req.body);
    if (error) {
      return res.status(400).json({
        status: "failed",
        message: error.details[0].message,
        data: null,
      });
    }

    const { password, old_password } = req.body;

    const user = await User.findById(_id);
    const isPasswordValid = await bcrypt.compare(old_password, user.password);

    if (!isPasswordValid) {
      return res.status(400).send({
        data: null,
        message: "Incorrect credentials",
        status: "failed",
      });
    }

    // check if new password is the same as old password
    const isSamePassword = await bcrypt.compare(password, user.password);
    if (isSamePassword) {
      return res.status(400).send({
        data: null,
        message: "New password cannot be the same as old password",
        status: "failed",
      });
    }

    //Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();
    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.log("🚀 ~ file: user.controller.js:245 ~ changePassword ~ error:", error)
    return res.status(500).json({
      status: "Failed",
      Message: "Unable to change user password",
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { page, perPage, search, withPagination } = req.query;

    const options = {
      limit: perPage || PER_PAGE,
      page: page || 1,
      sort: { _id: -1 },
    };


    const matchStage = {};
    if (search) {
      const trimmedSearch = search.trim();
      matchStage.$or = [
        { firstName: { $regex: new RegExp(trimmedSearch, "i") } },
        { lastName: { $regex: new RegExp(trimmedSearch, "i") } },
        { email: { $regex: new RegExp(trimmedSearch, "i") } },
        {
          $expr: {
            $regexMatch: {
              input: { $concat: ["$firstName", " ", "$lastName"] },
              regex: new RegExp(trimmedSearch, "i"),
            },
          },
        },
      ];
    }


    const totalCount = await User.countDocuments(matchStage);

    if (withPagination === 'false') {
      const users = await User.find(matchStage)
        .sort({ _id: -1 })
        .populate({
          path: "organizationId",
          select: "accountName",
        })
        .populate({
          path: "privileges",
          select: "name",
        });

      if (totalCount == 0) {
        return res.status(404).json({
          message: "No user found with the provided name",
          status: "failed",
        });
      }

      return res.status(200).json({
        message: "Successfully fetched users",
        data: {
          users,
          meta: { total: totalCount },
        },
        status: "success",
      });
    }

    const users = await User.find(matchStage)
      .sort(options.sort)
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .populate({
        path: "organizationId",
        select: "accountName",
      })
      .populate({
        path: "privileges",
        select: "name",
      });

    if (totalCount == 0) {
      return res.status(404).json({
        message: "No user found with the provided name",
        status: "failed",
      });
    }

    return res.status(200).json({
      message: "Successfully fetched users",
      data: {
        users,
        meta: { total: totalCount, page: options.page, perPage: options.limit },
      },
      status: "success",
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
      data: null,
      status: "failed",
    });
  }
};

const deleteNonAdminUsers = async (req, res) => {
  try {
    const { name, id } = req.body;
    const user = await User.findById(id);
    if (
      user.privileges.includes("superUser") ||
      user.privileges.includes("admin")
    )
      return res.status(401).json({
        message: "You cannot delete a user with admin role",
        data: null,
        status: "failed",
      });

    const result = await User.findByIdAndDelete(id);
    res.status(200).json({
      message: "User Deleted Successfully",
      status: "success",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error.message,
      data: null,
      status: "failed",
    });
  }
};

const deleteAnyUser = async (req, res) => {
  try {
    const { name, id } = req.body;

    const result = await User.findByIdAndDelete(id);
    res.status(200).json({
      message: "User Deleted Successfully",
      status: "success",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error.message,
      data: null,
      status: "failed",
    });
  }
};

const createSecurityQuestions = async (req, res) => {
  const { email, secretQuestions, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "User does not exist",
        data: null,
        status: "failed",
      });
    }

    user.secretQuestions = secretQuestions;
    user.is2FAEnabled = true;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    //update the user
    res.status(200).json({
      message: "Security questions created successfully",
      data: user,
      status: "success",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      data: null,
      status: "failed",
    });
  }
};

const getAllAdmins = async (req, res) => {
  try {
    const { page = 1, limit = 10, name = "" } = req.query;

    const filter = {};
    if (name) {
      filter.$or = [
        { firstName: { $regex: name, $options: "i" } },
        { lastName: { $regex: name, $options: "i" } },
      ];
    }
    filter.role = "admin";

    const count = await User.countDocuments(filter);
    const totalPages = Math.ceil(count / limit);

    const fetchAdmins = await User.find(filter)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return res.status(200).json({
      message: "Admins retrieved successfully",
      data: fetchAdmins,
      totalPages,
      totalData: count,
      currentPage: page,
      status: "success",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      data: null,
      status: "failed",
    });
  }
};

const disableUser = async (req, res) => {
  try {
    const checkUser = await User.findOne({ _id: req.params.id })
    if (!checkUser) {
      return res.status(400).send({
        success: false,
        message: 'user not found on this system'
      })
    }

    if (checkUser.disabled === true) {
      return res.status(400).send({
        success: false,
        message: 'this account is already disabled'
      })
    }

    //check if account is tied to a mandate
    const checkMandate = await Mandate.find({ $or: [{ authoriser: req.params.id }, { verifiers: { $in: [req.params.id] } }] })

    if (checkMandate.length > 0) {
      return res.status(422).send({
        success: false,
        message: 'Sorry this user is already tied a mandate, replace this user from all available mandates before disabling.'
      })
    }

    // check for otp
    const checkOtp = await otpModel.findOne({ user: req.user._id, otp: req.body.otp, context: 'disable user' })
    if (!checkOtp) {
      return res.status(400).send({
        success: false,
        message: 'invalid otp'
      })
    }

    const disableUser = await User.updateOne({ _id: req.params.id }, { $set: { disabled: true } })
    const user = await userService.getUserById(req.user._id);
    const { date, time } = getDateAndTime();

    if (disableUser.modifiedCount > 0) {
      //create audit trial
      const auditTrail = {
        user: req.user._id,
        type: "disable account",
        message: `${user.firstName} ${user.lastName} disabled ${checkUser.firstName} ${checkUser.lastName} account on ${date} by ${time}`,
      };
      await auditTrailService.createAuditTrail(auditTrail)
      checkOtp.delete()
      return res.status(200).send({
        success: true,
        message: 'Account successfully disabled'
      })
    }
    return res.status(500).send({
      success: false,
      message: 'Error disabling account'
    })
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: error.message
    })
  }
}

const enableUser = async (req, res) => {
  try {
    const checkUser = await User.findOne({ _id: req.params.id })

    if (!checkUser) {
      return res.status(400).send({
        success: false,
        message: 'user not found on this system'
      })
    }

    const checkOtp = await otpModel.findOne({ user: req.user._id, otp: req.body.otp, context: 'enable user' })

    if (!checkOtp) {
      return res.status(400).send({
        success: false,
        message: 'Invalid OTP'
      })
    }

    if (checkUser.disabled === false) {
      return res.status(400).send({
        success: false,
        message: 'this account is already enabled'
      })
    }

    const enableUser = await User.updateOne({ _id: req.params.id }, { $set: { disabled: false } })
    const user = await userService.getUserById(req.user._id);

    const { date, time } = getDateAndTime();
    if (enableUser.modifiedCount > 0) {
      const auditTrail = {
        user: req.user._id,
        type: "enable account",
        message: `${user.firstName} ${user.lastName} enabled ${checkUser.firstName} ${checkUser.lastName} account on ${date} by ${time}`,
      };

      await auditTrailService.createAuditTrail(auditTrail)
      checkOtp.delete()

      return res.status(200).send({
        success: true,
        message: 'Account successfully enable'
      })
    }

    return res.status(500).send({
      success: false,
      message: 'Error enabling account'
    })
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: error.message
    })
  }
}

const deleteAccount = async (req, res) => {
  try {

    const findAccount = await User.findOne({ _id: mongoose.Types.ObjectId(req.params.id) });

    if (!findAccount) {
      return res.status(400).send({
        success: false,
        message: 'This account does not exist'
      });
    }

    const deleteUser = await User.deleteOne({ _id: req.params.id });

    if (deleteUser.deletedCount < 1) {
      return res.status(500).send({
        success: false,
        message: 'something went wrong error deleting user'
      })
    }
    const checkForAdmin = await Account.find({ adminID: req.params.id });
    if (checkForAdmin.length > 0) {
      await Account.updateMany(
        { adminID: req.params.id },
        { $unset: { adminID: "" } }
      );
    }
    return res.status(200).send({
      success: true,
      message: 'user successfully deleted'
    })
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      messsage: error.message,
    });
  }
}

const editEmail = async (req, res) => {
  try {
    const checkIf_userExit = await User.findOne({ email: req.body.email })
    if (!checkIf_userExit) {
      return res.status(400).send({
        success: false,
        message: 'user with this email does not exist'
      })
    }

    // check for otp
    const checkOtp = await otpModel.findOne({ user: req.user._id, otp: req.body.otp })
    if (!checkOtp) {
      return res.status(400).send({
        success: false,
        message: 'invalid otp'
      })
    }

    // check if the new email is already in use
    const checkIf_newEmailExist = await User.findOne({ email: req.body.newEmail })
    if (checkIf_newEmailExist) {
      return res.status(400).send({
        success: false,
        message: 'This email is already in use'
      })
    }

    // update email 

    checkIf_userExit.email = req.body.newEmail
    checkIf_userExit.save()
    checkOtp.delete()

    return res.status(200).send({
      success: true,
      message: 'email updated successfully'
    })

  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      messsage: error.message,
    });
  }
}

module.exports = {
  getOrganizationUsers,
  getUserProfile,
  changePassword,
  updateUserProfile,
  getAllUsers,
  deleteNonAdminUsers,
  deleteAnyUser,
  createSecurityQuestions,
  updateUserPriviledge,
  getUserProfileById,
  getAllAdmins,
  disableUser,
  enableUser,
  deleteAccount,
  editEmail
};
