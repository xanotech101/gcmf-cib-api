const User = require("../../model/user.model");
const Priviledge = require("../../model/priviledge");
const { validateChangePasswordSchema } = require("../../utils/utils");
const bcrypt = require("bcrypt");

const getOrganizationUsers = async (req, res) => {
  const { organizationId } =  req.user
  try {

    const user = await User.find({ organizationId });
    
    if (!user) {
      res.status(404).json({ 
        message: "User not found",
        data: null,
        status: "failed"
      })
    }

    res.status(200).json({
      message: "Successfully fetched user",
      data: {
        user
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
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

module.exports = {
  getOrganizationUsers,
  getUserProfile,
  changePassword,
  getAllPriviledges,
};