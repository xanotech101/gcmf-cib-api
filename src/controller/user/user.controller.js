const User = require("../../model/user.model");
const Priviledge = require("../../model/priviledge");
const { validateChangePasswordSchema } = require("../../utils/utils");
const bcrypt = require("bcrypt");
const { PER_PAGE } = require("../../utils/constants");

  const getOrganizationUsers = async (req, res) => {
  const { organizationId } =  req.user
  try {
      const { perPage, page } = req.query;

      const options = {
        page: page || 1,
        limit: perPage || PER_PAGE,
        sort: { createdAt: -1 },
      };

    // const user = await User.find({ organizationId });
      const { privilege } = req.query;
  const users = await User.find({
    organizationId,
    privileges: privilege ? { $in: [privilege] } : { $exists: true },
  });
    
    if (!users) {
      res.status(404).json({ 
        message: "User not found",
        data: null,
        status: "failed"
      })
    }


    res.status(200).json({
      message: "Successfully fetched user",
      data: users ?? [],
    });
    
  } catch (error) {
    console.log(error);
    res.status(500).json({ 
      message: error.message,
      status: "failed"
    });
  }
};



const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({
      message: "Successfully fetched user",
      data: { user},
      status: "success"
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ 
      message: error.message,
      data: null,
      status: "failed"
    });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const { firstName, lastName, phoneNumber, imageUrl } = req.body;

    user.firstName = firstName;
    user.lastName = lastName;
    user.phoneNumber = phoneNumber;
    user.imageUrl = imageUrl;

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


const changePassword = async (req, res) => {
  const { _id } = req.user;
  try {
    const { error } = validateChangePasswordSchema(req.body);
    if (error) {
      return res.status(400).json({
        status: "failed",
        message: error.details[0].message,
        data: null,
      })
    };

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

// TODO: please move to a separate controller called privilege, also create a route for this and reference it in app.js
const getAllPriviledges = async (req, res) => {
  try {
    const priviledge = await Priviledge.find();
    res.status(200).json({
      message: "Successfully fetched priviledges",
      data: { priviledge },
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

const getAllUsers = async (req, res) => {
  try {


    const { page, perPage } = req.query;
    console.log(req.query)

    const options = {
      limit: perPage || PER_PAGE,
      page: page || 1,
      sort: { createdAt: -1 }
    };

    const user = await User.aggregate([
{
      $facet: {
        data: [
          {
            $sort: { ...options.sort },
          },
          {
            $skip: options.limit * (options.page - 1),
          },
          {
            $limit: options.limit * 1,
          },
        ],
        meta: [
          {
            $count: "total",
          },
          {
            $addFields: {
              page: options.page,
              perPage: options.limit,
            },
          }

        ],
      },
    }

      ])



    res.status(200).json({
      message: "Successfully fetched all users",
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

module.exports = {
  getOrganizationUsers,
  getUserProfile,
  changePassword,
  getAllPriviledges,
  updateUserProfile,
  getAllUsers
};
