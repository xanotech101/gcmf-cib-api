const Mandate = require("../model/mandate");
const InitiateRequest = require("../model/initiateRequest");
const { validateInitiateRequestSchema } = require("../utils/utils");

const jwt = require("jsonwebtoken");
const { sendEmail } = require("../utils/emailService");
const uuid = require("uuid");

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
    const uniqueRandomID = uuid.v4();
    console.log(uniqueRandomID);
      //  requestID: uniqueRandomID,
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

    let authorizerIDArr = [];
    let emails = [];
    let mandateID;
    let authorizerID;

    mandate.map((item) => {
      if (
        request.amount >= item.minAmount &&
        request.amount <= item.maxAmount
      ) {
        //Send email logic here
        //.....
        authorizerID = item.AuthorizerID;
        mandateID = item._id
      }
        authorizerIDArr.push(authorizerID);
    });

    console.log("authorizerIDArr", authorizerID);
    request.authorizerID = authorizerID;
    request.mandateID = mandateID;
    request.isApproved = 'active';
    console.log(request.authorizerID);


    let result = await request.save();

    // let requester = await InitiateRequest.find({ requestID: result.requestID });
    
    //  let mandater = await Mandate.find({
    //    _id: result.requestID,
    //  });
    
    console.log(result)

    return res.status(201).json({
      message: "Inititate request succesfully sent for approval",
      "Request Details": result,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};



const updateRequest = async (req, res) => {
  try {
    let id = req.params.id;
    let request = await InitiateRequestfind({ _id: id.toString });
    request.declineResponse = req.body.declineResponse;
    await request.save();

    return res.status(200).json({
      message: "Dissaproval Messaged received",
      request,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};


const getAllRequestByAuthorisersId = async (req, res) => {
  try {
    console.log(req.user);
    let request = await InitiateRequest.find({ authorizerID: req.user._id });

  


      //  const user = await User.findById(req.user._id);
    return res.status(200).json({
      message: "Request Successful",
      request,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};



const getAllRequest = async (req, res) => {
  try {
    let request = await InitiateRequest.find({})
      .populate("mandateID");
    console.log(request)

    return res.status(200).json({
      message: "Request Successful",
      data: request,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};


module.exports = { initiateRequest, updateRequest, getAllRequestByAuthorisersId, getAllRequest };
