const Mandate = require("../../model/mandate.model");
const InitiateRequest = require("../../model/initiateRequest");
const { validateInitiateRequestSchema } = require("../../utils/utils");
const { sendEmail } = require("../../utils/emailService");
const { PER_PAGE } = require("../utils/constants");

const initiateRequest = async (req, res) => {
  try {
    const { error } = validateInitiateRequestSchema(req.body);
    if (error) return res.status(400).json({
      message: error.details[0].message,
      status: "failed"
    });
   
    const request = new InitiateRequest({
      customerName: req.body.customerName,
      amount: req.body.amount,
      bankName: req.body.bankName,
      accountNumber: req.body.accountNumber,
      accountName: req.body.accountName,
    });

    const mandate = await Mandate.find({}).select(
      "minAmount maxAmount authorizers"
    );

    let emails = [];
    let mandateID;
    let authorizerID;

    // find a way to query the mandate db where the amount provided falls within the min and max amount
    mandate.map((item) => {
      if (
        request.amount >= item.minAmount &&
        request.amount <= item.maxAmount
      ) {
        //Send email logic here
        //.....

        // await sendEmail()
        authorizerID = item.authorizers;
        mandateID = item._id;
      }
    });


    request.authorizerID = authorizerID;
    request.mandateID = mandateID;
    request.isApproved = "active";

    const result = await request.save();

    res.status(201).json({
      message: "Initiate request successfully sent for approval",
      data: result
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ 
      message: error.message,
      status: "failed"
    });
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
            }
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
            }
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
            }
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
