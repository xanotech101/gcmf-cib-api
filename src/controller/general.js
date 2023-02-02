const SuperUser = require("../model/superUser");
const User = require("../model/user");
const Mandate = require("../model/mandate");
const InitiateRequest = require("../model/initiateRequest");
const { validateInitiateRequestSchema } = require("../utils/utils");
const multer = require("multer");
const jwt = require("jsonwebtoken")
const { sendEmail } = require("../utils/emailService");
const uuid = require('uuid');
let csvToJson = require("convert-csv-to-json");
const fs = require("fs")


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
 

    const { error } = validateInitiateRequestSchema(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    // let initiateRequest = await InitiateRequest.find({
    //   accountNumber: req.user.accountNumber,
    // });
    // if (!user) return res.status(404).json({ message: "User not found" });

    // let currTime = new Date().now;
    // const d = new Date("July 21, 1983 01:15:00");
    // let minutes = d.getUTCMinutes();

    const uniqueRandomID = uuid.v4()
    console.log(uniqueRandomID)

    let request = new InitiateRequest({
      requestID: uniqueRandomID,
      customerName: req.body.customerName,
      amount: req.body.amount,
      bankName: req.body.bankName,
      accountNumber: req.body.accountNumber,
      accountName: req.body.accountName,
    });

    // const duplicateRequest = await InitiateRequest.findOne({
    //   time: new Date().now,
    // });

    // if (duplicateRequest) return res
    //   .status(400)
    //   .json({
    //     message:
    //       "Duplicate Transaction Detected. It seems you just initiated this requst.",
    //   });

    // if (duplicateRequest) {
    //   if (duplicateRequest.amount === request.amount && duplicateRequest.bankName === request.bankName && duplicateRequest.accountNumber === request.accountNumber) { return res.status(400).json({ message: "Duplicate Transaction Detected. It seems you just initiated this requst." }) }
    // }

    // let resul = await InitiateRequest.find({});

    let mandate = await Mandate.find({}).select(
      "minAmount maxAmount AuthorizerID"
    );

    let authorizerID;
    let emails = [];

    mandate.map((item) => {
      if (
        request.amount >= item.minAmount &&
        request.amount <= item.maxAmount
      ) {
        authorizerID = item.AuthorizerID;
      }
    });

    for (let i = 0; i < authorizerID.length; i++) {
      let user = await User.findById(authorizerID[i]);
      const token = jwt.sign(
        { user_email: user.email },
        process.env.EMAIL_SECRET,
        {
          expiresIn: "30m",
        }
      );
      const link = `${process.env.FRONTEND_URL}/request-approval/${token}`;

      const subject = "Request Approval";
      const message = `

    <p>Dear ${user.firstName},</p> 
    <p>A loan request was initiated for your approval. </p> 
    <a href= ${link}><h4>KINDLY LOGIN TO VIEW REQUEST</h4></a> 
    <p>If the above link is not working, You can click the link below.</p>
    <p>${link}</p>
  `;

      await sendEmail(user.email, subject, message);
    }

    let result = await request.save();

    return res.status(201).json({
      message: "Your request has succesfully been sent for approval",

    });


    
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};


const batchUpload = async (req, res) => {

  try {
    let data= csvToJson.fieldDelimiter(",").getJsonFromCsv(req.file.path);

    fs.unlinkSync(req.file.path);
    res.status(200).json({ message : "File uploaded successfully", data});
}catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }

}

const updateRequest = async (req, res) => {
  try {
    let id = req.params.id;
    let request = await InitiateRequestfind({ _id: id.toString });
    request.declineResponse = req.body.declineResponse
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



 




module.exports = {
  getUsersByID,
  getUsersByOrgID,
  initiateRequest,
  batchUpload,
  updateRequest,
};