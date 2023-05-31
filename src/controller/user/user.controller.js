const User = require("../../model/user.model");
const bcrypt = require("bcrypt");
const { PER_PAGE } = require("../../utils/constants");
const mongoose = require("mongoose");
const Privilege = require("../../model/privilege.model");

const getOrganizationUsers = async (req, res) => {
  //search first name lastname email
  try {
    const { perPage, page } = req.query;

    const id = req.query?.branchId ?? organizationId;

    const options = {
      page: page || 1,
      limit: perPage || PER_PAGE,
      sort: { _id: -1 },
    };

    const { privilege, withPagination } = req.query;

    const privilegeId =
      (await Privilege.findOne({ name: privilege })?._id) || null;

    if (withPagination === "true") {
      const totalCount = await User.countDocuments({
        organizationId: mongoose.Types.ObjectId(id),
      });

      const users = await User.find({
        organizationId: mongoose.Types.ObjectId(id),
      })
        .sort(options.sort)
        .skip((options.page - 1) * options.limit)
        .limit(options.limit)
        .select(
          "firstName lastName email phone gender role privileges organizationId isVerified"
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

    const users = await User.find({
      organizationId: mongoose.Types.ObjectId(id),
      privileges: privilegeId ? { $in: [privilege] } : { $exists: true },
      isVerified: true,
    })
      .sort({ _id: -1 })
      .select(
        "firstName lastName email phone gender role privileges organizationId isVerified"
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
    return res.status(500).json({
      status: "Failed",
      Message: "Unable to change user password",
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { page, perPage, search } = req.query;

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

const disableAccount = async (req, res) =>{
  try{
    const checkUser = await User.findOne({_id:req.params.userid})
    if(!checkUser){
      return res.status(400).send({
        success: false,
        message: 'user not found on this system'
      })
    }


    if(checkUser.disabled === true){
      return res.status(400).send({
        success: false,
        message: 'this account is already disabled'
      })
    }

    const disableUser = await User.updateOne({_id:req.params.userid},{$set:{disabled: true}})
    if(disableUser.modifiedCount > 0){
      return res.status(200).send({
        success: true,
        message: 'Account successfully disabled'
      })
    }
    return res.status(500).send({
      success: false,
      message: 'Error disabling account'
    })
  }catch(error){
    return res.status(500).send({
      success:false,
      message: error.message
    })
  }
}

const enableAccount = async (req, res) =>{
  try{
    const checkUser = await User.findOne({_id:req.params.userid})
    if(!checkUser){
      return res.status(400).send({
        success: false,
        message: 'user not found on this system'
      })
    }


    if(checkUser.disabled === false){
      return res.status(400).send({
        success: false,
        message: 'this account is already enabled'
      })
    }

    const enableUser = await User.updateOne({_id:req.params.userid},{$set:{disabled: false}})
    if(enableUser.modifiedCount > 0){
      return res.status(200).send({
        success: true,
        message: 'Account successfully enable'
      })
    }
    return res.status(500).send({
      success: false,
      message: 'Error enabling account'
    })
  }catch(error){
    return res.status(500).send({
      success:false,
      message: error.message
    })
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
  disableAccount,
  enableAccount
};
