const Mandate = require("../model/mandate");
const User = require("../model/user.model");
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


        // await sendEmail()
        authorizerID = item.AuthorizerID;
        mandateID = item._id;
        

      }
      authorizerIDArr.push(authorizerID);
    });


    console.log("authorizerIDArr", authorizerID);
    //TODO: code duplication, you don't need to save autorizer id here again, all you need is the mandateId
    request.authorizerID = authorizerID;
    request.mandateID = mandateID;
    request.isApproved = "active";

    let result = await request.save();

    // let requester = await InitiateRequest.find({ requestID: result.requestID });

    //  let mandater = await Mandate.find({
    //    _id: result.requestID,
    //  });
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
    const _id = req.params.id;
    const userId = req.user._id;
    const request = await InitiateRequest.findOneAndUpdate(
      {
        _id,
        authorizerID: { $in: [userId] },
      },
      {
        $push: {
          declineResponse: {
            authorizerID: userId,
            reason: req.body.reason,
          }
        },
      },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({
        message: "Request not found",
        status: "failed",
      });
    }

    return res.status(200).json({
      message: "Request declined successfully",
      request,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

const getAllAuthoriserRequests = async (req, res) => {
  try {
    const request = await InitiateRequest.find({
      authorizerID: { $in: [req.user._id] },
    });

    res.status(200).json({
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
    const request = await InitiateRequest.find().populate("mandateID");
    console.log(request);

    res.status(200).json({
      message: "Request Successful",
      data: request,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

const getRequestById = async (req, res) => {
  try {
    const _id = req.params.id;

    const request = await InitiateRequest.findOne({ _id })
      .populate("mandateID")
      .populate({
        path: "authorizerID",
        model: "User",
        select: "firstName lastName email",
      });

    if (!request) {
      return res.status(404).json({
        message: "Request not found",
        status: "success",
      });
    }
    res.status(200).json({
      message: "Request Successful",
      data: request,
      status: "success",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      status: "error",
    });
  }
};



const getAllInitiatorRequests = async (req, res) => {
  try {

    const request = await InitiateRequest.find({
      initiatorID: req.user._id,
    });

    res.status(200).json({
      message: "Request Successful",
      request,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};








module.exports = {
  initiateRequest,
  updateRequest,
  getAllInitiatorRequests,
  getAllRequest,
  getRequestById,
  getAllAuthoriserRequests,
};
