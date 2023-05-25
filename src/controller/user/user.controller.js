const User = require("../../model/user.model");
const bcrypt = require("bcrypt");
const { PER_PAGE } = require("../../utils/constants");
const mongoose = require("mongoose");
const Privilege = require("../../model/privilege.model");

const getOrganizationUsers = async (req, res) => {
  //search first name lastname email
  const { organizationId } = req.user;
  try {
    const { perPage, page } = req.query;

    const id = req.query?.branchId ?? organizationId;

    const options = {
      page: page || 1,
      limit: perPage || PER_PAGE,
      sort: { createdAt: -1 },
    };

    const { privilege, withPagination } = req.query;

    const privilegeId =
      (await Privilege.findOne({ name: privilege })?._id) || null;

    if (withPagination === "true") {
      const users = await User.aggregate([
        {
          $match: {
            organizationId: mongoose.Types.ObjectId(id),
          },
        },
        {
          $addFields: {
            privileges: {
              $map: {
                input: "$privileges",
                as: "privilege",
                in: {
                  $toObjectId: "$$privilege",
                },
              },
            },
          },
        },
        {
          $lookup: {
            from: "privileges",
            localField: "privileges",
            foreignField: "_id",
            as: "privileges",
            pipeline: [{ $project: { name: 1 } }],
          },
        },
        {
          $lookup: {
            from: "accounts",
            localField: "organizationId",
            foreignField: "_id",
            as: "organizationId",
          },
        },
        {
          $unwind: "$organizationId",
        },
        {
          $project: {
            firstName: 1,
            lastName: 1,
            email: 1,
            phone: 1,
            gender: 1,
            role: 1,
            privileges: 1,
            organizationId: 1,
            isVerified: 1,
          },
        },
        {
          $facet: {
            data: [
              { $skip: options.limit * (options.page - 1) },
              { $limit: options.limit },
              { $sort: { ...options.sort } },
            ],
            totalCount: [
              { $count: "count" },
              {
                $addFields: {
                  page: options.page,
                  perPage: options.limit,
                },
              },
            ],
          },
        },
      ]);

      return res.status(200).json({
        message: "Successfully fetched user",
        data: {
          users: users[0].data,
          meta: users[0].meta,
        },
      });
    }

    const users = await User.aggregate([
      {
        $match: {
          organizationId: mongoose.Types.ObjectId(id),
          privileges: privilegeId ? { $in: [privilege] } : { $exists: true },
          isVerified: true,
        },
      },
      {
        $addFields: {
          privileges: {
            $map: {
              input: "$privileges",
              as: "privilege",
              in: {
                $toObjectId: "$$privilege",
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: "privileges",
          localField: "privileges",
          foreignField: "_id",
          as: "privileges",
          pipeline: [{ $project: { name: 1 } }],
        },
      },
    ]);

    if (!users) {
      res.status(404).json({
        message: "User not found",
        data: null,
        status: "failed",
      });
    }

    res.status(200).json({
      message: "Successfully fetched user",
      data: users ?? [],
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
    const { page, perPage, name } = req.query;
const options = {
  limit: perPage || PER_PAGE,
  page: page || 1,
  sort: { _id: -1 },
};

const matchStage = {};
if (name) {
  const [firstName, lastName, email] = name ? name.split(" ") : ["", ""];
  matchStage.$or = [
    { firstName: { $regex: new RegExp(firstName, "i") } },
    { lastName: { $regex: new RegExp(lastName, "i") } },
    { email: { $regex: new RegExp(email, "i") } },
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
  data: { users, meta: { total: totalCount, page: options.page, perPage: options.limit } },
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
    const { page = 1, limit = 10, name = '' } = req.query;

    const filter = {};
    if (name) {
      filter.$or = [
        { firstName: { $regex: name, $options: 'i' } },
        { lastName: { $regex: name, $options: 'i' } },
      ];
    }
    filter.role = 'admin';

    const count = await User.countDocuments(filter);
    const totalPages = Math.ceil(count / limit);

    const fetchAdmins = await User.find(filter)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return res.status(200).json({
      message: 'Admins retrieved successfully',
      data: fetchAdmins,
      totalPages,
      totalData: count,
      currentPage: page,
      status: 'success',
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      data: null,
      status: 'failed',
    });
  }
};

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
  getAllAdmins
};
