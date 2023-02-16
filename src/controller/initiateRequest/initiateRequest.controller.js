const Mandate = require("../../model/mandate.model");
const InitiateRequest = require("../../model/initiateRequest.model");
const AuditTrail = require("../../model/auditTrail");
const Notification = require("../../model/notification");
const { validateInitiateRequestSchema } = require("../../utils/utils");
const { sendEmail } = require("../../utils/emailService");
const { PER_PAGE } = require("../../utils/constants");
const mongoose = require("mongoose");

const initiateRequest = async (req, res) => {
  try {
    const { error } = validateInitiateRequestSchema(req.body);
    if (error)
      return res.status(400).json({
        message: error.details[0].message,
        status: "failed",
      });

    const request = new InitiateRequest({
      customerName: req.body.customerName,
      amount: req.body.amount,
      bankName: req.body.bankName,
      accountNumber: req.body.accountNumber,
      accountName: req.body.accountName,
    });

    const mandate = await Mandate.findOne({
      minAmount: { $lte: request.amount },
      maxAmount: { $gte: request.amount },
    }).populate({
      path: "authorizers",
      select: "firstName lastName email",
    });

    if (!mandate) {
      return res.status(404).json({
        message: "No mandate found",
        status: "failed",
      });
    }

    request.mandate = mandate._id;
    request.initiator = req.user._id;

    const result = await request.save();


    for (let i = 0; i < mandate.authorizers.length; i++) {
      const authorizer = mandate.authorizers[i];

      //In-app authorizers
    let notification = new Notification({
      transaction: result._id,
      userID : authorizer._id,
      message: "A request has been initiated. Kindly review",
    });
      
      await notification.save();
      
      //Mail notification
      const subject = "Loan Request Initiated";
      const message = `
          <h3>Loan Request Initiated</h3>
          <p> Dear ${authorizer.firstName}. A request was initiated.</p>
          <p>Kindly login to your account to view</p>
        `;
       
      await sendEmail(authorizer.email, subject, message);
    }
   
    const auditTrail = new AuditTrail({
      type: "transaction",
      transaction: result._id,
    });

    await auditTrail.save();

    return res.status(201).json({
      message: "Initiate request successfully sent for approval",
      data: result,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error.message,
      status: "failed",
    });
  }
};

const declineRequest = async (req, res) => {
  try {

    const _id = req.params.id;
    const userId = req.user._id;

  const request = await InitiateRequest.findById(_id);
 
    if (!request) {
      return res.status(404).json({
        message: "Request not found",
        status: "failed",
      });
    }

   for (let i = 0; i < request.authorizersAction.length; i++) {
      let transaction = request.authorizersAction[i];
      if (transaction.authorizerID == req.user._id && transaction.status === "rejected") {
        return res.status(404).json({
          message: "You have already rejected this request",
          status: "failed",
        });
      } else if (
        transaction.authorizerID == req.user._id &&
        transaction.status === "authorised"
      ) {
        transaction.status = "rejected";
        transaction.reason = req.body.reason;
      }
   }
    
    request.authorizersAction.push(
      {
        status: "rejected",
        authorizerID: userId,
        reason: req.body.reason
      }
    )

    await request.save();
    //In-app authorizers
    const notification = new Notification({
      transaction: request._id,
      userID: request.initiator,
      message: "A request has been initiated. Kindly review",
    });
    await notification.save();


    return res.status(200).json({
      message: "Request declined successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

const approveRequest = async (req, res) => {
  try {
    const _id = req.params.id;
    const userId = req.user._id;

    const request = await InitiateRequest.findById(_id);

        if (!request) {
          return res.status(404).json({
            message: "Request not found",
            status: "failed",
          });
        }
    
    for (let i = 0; i < request.authorizersAction.length; i++) {
      let transaction = request.authorizersAction[i];
      if (transaction.authorizerID == req.user._id && transaction.status === "authorised") {
        return res.status(404).json({
          message: "You have already approved this transaction",
          status: "failed",
        });
      } else if (
        transaction.authorizerID == req.user._id &&
        transaction.status === "rejected"
      ) {
        transaction.status = "authorised";
        delete transaction.reason
      }
    }

  request.authorizersAction.push({
    status: "authorised",
    authorizerID: userId,
    reason: ""
  });
    
 await request.save();
    //In-app authorizers
    const notification = new Notification({
      transaction: request._id,
      userID: request.initiator,
      message: "A request has been initiated. Kindly review",
    });
    await notification.save();

    return res.status(200).json({
      message: "Request approved successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

const getAllInitiatorRequests = async (req, res) => {
  const { perPage, page } = req.query;
  console.log(req.user);

  const options = {
    page: page || 1,
    limit: perPage || PER_PAGE,
    sort: { createdAt: -1 },
  };

  try {
    const requests = await InitiateRequest.aggregate([
      {
        $match: {
          initiator: mongoose.Types.ObjectId(req.user._id),
        },
      },
      {
        $lookup: {
          from: "mandates",
          localField: "mandate",
          foreignField: "_id",
          as: "mandate",
        },
      },
      {
        $unwind: "$mandate",
      },
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
            },
          ],
        },
      },
    ]);

    res.status(200).json({
      message: "Request Successful",
      data: {
        requests: requests[0].data,
        meta: requests[0].meta[0],
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

const getAllAuthorizerRequests = async (req, res) => {
  const { perPage, page } = req.query;

  const options = {
    page: page || 1,
    limit: perPage || PER_PAGE,
    sort: { createdAt: -1 },
  };

  try {
    const requests = await InitiateRequest.aggregate([
      {
        $lookup: {
          from: "mandates",
          localField: "mandateID",
          foreignField: "_id",
          as: "mandate",
        },
      },
      {
        $unwind: "$mandate",
      },
      {
        $match: {
          "mandate.authorizers": {
            $in: [mongoose.Types.ObjectId(req.user._id)],
          },
        },
      },
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
            },
          ],
        },
      },
    ]);

    res.status(200).json({
      message: "Request Successful",
      data: {
        requests: requests[0].data,
        meta: requests[0].meta[0],
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

const getAllRequest = async (req, res) => {
  const { page, perPage } = req.query;

  const options = {
    page: page || 1,
    limit: perPage || PER_PAGE,
    sort: { createdAt: -1 },
  };

  try {
    const request = await InitiateRequest.aggregate([
      {
        $lookup: {
          from: "mandates",
          localField: "mandate",
          foreignField: "_id",
          as: "mandate",
        },
      },
      {
        $unwind: "$mandate",
      },
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
            },
          ],
        },
      },
    ]);

    res.status(200).json({
      message: "Request Successful",
      data: {
        requests: request[0].data,
        meta: request[0].meta[0],
      },
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
      .populate({
        path: "mandate",
        select: "maxAmount minAmount authorizers",
        populate: {
          path: "authorizers",
          model: "User",
          select: "firstName lastName email",
        },
      })
      .populate({
        path: "initiator",
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

module.exports = {
  initiateRequest,
  declineRequest,
  approveRequest,
  getAllInitiatorRequests,
  getAllRequest,
  getRequestById,
  getAllAuthorizerRequests,
};
