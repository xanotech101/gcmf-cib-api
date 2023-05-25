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


const createPrivileges = async (req, res) => {
  try {
    const privileges = await Privilege.findOne({name:req.body.name});
    if(privileges){
      return res.status(400).json({
        message: "this privilege already exist",
        status: "fail",
      });
    }
    const create = await Privilege.create({
      name:req.body.name
    })

    res.status(200).json({
      message: "Successfully created privilege",
      data: { create },
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
  getAllPrivileges,createPrivileges
};
