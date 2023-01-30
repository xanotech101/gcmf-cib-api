const SuperUser = require("../model/superUser");
const User = require("../model/user");
const InitiateRequest = require("../model/initiateRequest");
const { validateInitiateRequestSchema } = require("../utils/utils");


const getUsersByID = async (req, res) => {
    console.log("this is the req", req.user)
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


const initiateRequest = async (req, res) => {

  try {
    // if (
    //   !req.user.priviledge.includes("initiator") ||
    //   !req.user.priviledge.includes("admin") ||
    //   req.user.priviledge.includes("superAdmin")
    // )
    //   return res
    //     .status(403)
    //     .json({ message: "You are unauthorised to make this request." });
    
     const { error } = validateInitiateRequestSchema(req.body);
     if (error) return res.status(400).send(error.details[0].message);

    // let initiateRequest = await InitiateRequest.find({
    //   accountNumber: req.user.accountNumber,
    // });
    // if (!user) return res.status(404).json({ message: "User not found" });


    let request = new InitiateRequest({
      customerName: req.body.customerName,
      amount: req.body.amount,
      bankName: req.body.bankName,
      accountNumber: req.body.accountNumber,
      accountName: req.body.accountName,
    });

    
 let mandate = await Mandate.find({}).select(
   "minAmount maxAmount AuthorizerID"
 );

    console.log(request);
    console.log(mandate);
//     mandate.map(item => {
//   if(request.amount)
// })
  
    let result = await request.save();



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