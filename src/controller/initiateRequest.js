const Mandate = require("../model/mandate.model");
const AuditTrail = require("../model/auditTrail");
const User = require("../model/user.model");
const InitiateRequest = require("../model/initiateRequest");
const { validateInitiateRequestSchema } = require("../utils/utils");

const jwt = require("jsonwebtoken");
const { sendEmail } = require("../utils/emailService");
const uuid = require("uuid");
const { PER_PAGE } = require("../utils/constants");

const initiateRequest = async (req, res) => {
  try {
    const { error } = validateInitiateRequestSchema(req.body);
      if (error) return res.status(400).send(error.details[0].message);
      
    let request = new InitiateRequest({
      customerName: req.body.customerName,
      amount: req.body.amount,
      bankName: req.body.bankName,
      accountNumber: req.body.accountNumber,
      accountName: req.body.accountName,
    });

    let mandate = await Mandate.find({}).select(
      "minAmount maxAmount authorizers"
    );

    let mandateID;

    mandate.forEach((item) => {
      if (
        request.amount >= item.minAmount &&
        request.amount <= item.maxAmount
      ) {
        request.authorizerID = item.authorizers;
        mandateID = item._id;
      }
      request.mandateID = item.AuthorizerID;
    });

    for (let i = 0; i < request.authorizerID.length; i++) {
      let user = await User.findById(request.authorizerID[i]);

      const subject = "Loan Request Initiated";
      const message = `
          <h3>Loan Request Initiated</h3>
          <p> Dear ${user.firstName}. A request was initiated.</p>
          <p>Kindly login to your account to view</p>
        `;
      await sendEmail(user.email, subject, message);
    }

    //TODO: code duplication, you don't need to save autorizer id here again, all you need is the mandateId
    // request.authorizerID = authorizerID;
    request.mandateID = mandateID;
    request.isApproved = "active";

    let result = await request.save();

    let ress = await InitiateRequest.find().sort({ _id: -1 }).limit(1);
    console.log(ress);
    const auditTrail = new AuditTrail({
      type: "transaction",
      transactionID: ress[0]._id,
    });

    console.log(auditTrail);
    await auditTrail.save();

    return res.status(201).json({
      message: "Inititate request succesfully sent for approval",
      "Request Details": request,
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
          },
        },
      },
      {
        $set: {
          isApproved: "declined",
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
        $match: {
          authorizerID: { $in: [req.user._id] },
        },
      },
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
        request: requests[0].data,
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
  console.log();
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
          localField: "mandateID",
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
      message: "Successfully fetched all users",
      result: request[0],
      status: "success",
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
  const { perPage, page } = req.query;

  const options = {
    page: page || 1,
    limit: perPage || PER_PAGE,
    sort: { createdAt: -1 },
  };

  try {
    const requests = await InitiateRequest.aggregate([
      {
        $match: {
          initiatorID: req.user._id,
        },
      },
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

module.exports = {
  initiateRequest,
  updateRequest,
  getAllInitiatorRequests,
  getAllRequest,
  getRequestById,
  getAllAuthorizerRequests,
};
