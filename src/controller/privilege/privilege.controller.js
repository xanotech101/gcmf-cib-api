const Privilege = require("../../model/privilege.model");

const getAllPrivileges = async (req, res) => {
  try {
    const privileges = await Privilege.find();
    res.status(200).json({
      message: "Successfully fetched privileges",
      data: { privileges },
      status: "success",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error.message,
      status: "failed",
    });
  }
};




module.exports = {
  getAllPrivileges
};
