const SuperUser = require("../model/superUser");
const User = require("../model/user");
const InitiateRequest = ("../model/initiateRequest");
const { validateInitiateRequestSchema } = require("../utils/utils");


const getUsersByID = async (req, res) => {
    console.log("this is the req", req.user)
  let user;

    try {
        if (req.user.priviledge.includes("initiator") || req.user.priviledge.includes("verifier") || req.user.priviledge.includes("admin")) {
            user = await User.findById(req.user._id);
            console.log("hello user", user);
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


const initiateRequest = async (req, res) => {

  try {
    if (!req.user.priviledge.includes("initiator")) return res.status(403).json({message: "You are unauthorised to make this request."})
    
     const { error } = validateInitiateRequestSchema(req.body);
     if (error) return res.status(400).send(error.details[0].message);

    // let initiateRequest = await InitiateRequest.find({
    //   accountNumber: req.user.accountNumber,
    // });
    // if (!user) return res.status(404).json({ message: "User not found" });

    let initiateRequest = new InitiateRequest({
      customerName: req.body.customerName,
      amount: req.body.amount,
      bankName: req.body.bankName,
      accountNumber: req.body.accountNumber,
      accountName: req.body.accountName
    });

    let result = await initiateRequest.save();

    return res.status(201).json({
      message: "Inititate request succesfully sent for approval",
      "Request Details" : result,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};






module.exports = { getUsersByID, getUsersByOrgID, initiateRequest };