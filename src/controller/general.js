const SuperUser = require("../model/superUser");
const User = require("../model/user");


const getUsersByID = async (req, res) => {
    let user;
    try {
        if (req.user.priviledge.includes("initiator") || req.user.priviledge.includes("verifier") || req.user.priviledge.includes("admin")) {
            user = await User.findById(req.user._id);
        } else {
            user = await SuperUser.findById(req.user._id);
        }
      if (!user) return res.status(404).json({ message: "User not found" });

      return res.status(200).json({
        message: "Request Successfull",
        user,
      });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};





const getUsersByOrgID = async (req, res) => {
    let user;
    try {
        if (req.user.priviledge.includes("admin")) {
            user = await User.find({ organizationId: req.user.organizationId});
        } else {
            user = await SuperUser.find({ organizationId: req.user.organizationId});
        }
      if (!user) return res.status(404).json({ message: "User not found" });

       
      return res.status(200).json({
        message: "Request Successfull",
        user,
      });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};





module.exports = { getUsersByID, getUsersByOrgID }