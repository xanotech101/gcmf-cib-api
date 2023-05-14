const Mandate = require("../../model/mandate.model");
const User = require("../../model/user.model");
const InitiateRequest = require("../../model/initiateRequest.model");
const AuditTrail = require("../../model/auditTrail");
const { sendEmail } = require("../../utils/emailService");
const { PER_PAGE } = require("../../utils/constants");
const mongoose = require("mongoose");
const Otp = require("../../model/otp.model");
const {
  userService,
  auditTrailService,
  notificationService,
} = require("../../services");
const { getDateAndTime } = require("../../utils/utils");
const bankOneService = require("../../services/bankOne.service");
const Account = require("../../model/account");
const authToken = process.env.AUTHTOKEN;

const initiateRequest = async (req, res) => {
  try {
    const mine = await User.findById(req.user._id);
    const request = new InitiateRequest({
      NIPSessionID: req.body.NIPSessionID,
      amount: req.body.amount,
      narration: req.body.narration,
      payerAccountNumber: req.body.payerAccountNumber,
      beneficiaryAccountName: req.body.beneficiaryAccountName,
      beneficiaryAccountNumber: req.body.beneficiaryAccountNumber,
      beneficiaryAccountType: req.body.beneficiaryAccountType,
      beneficiaryBVN: req.body.beneficiaryBVN,
      beneficiaryBankCode: req.body.beneficiaryBankCode,
      beneficiaryBankName: req.body.beneficiaryBankName,
      beneficiaryKYC: req.body.beneficiaryKYC,
      beneficiaryPhoneNumber: req.body.beneficiaryPhoneNumber,
      organizationId: mine.organizationId.toString(),
      transactionReference: mongoose.Types.ObjectId().toString().substr(0, 12),
      type: req.body.type,
    });

    const mandate = await Mandate.findOne({
      organizationId: mine.organizationId.toString(),
      minAmount: { $lte: request.amount },
      maxAmount: { $gte: request.amount },
    }).populate({
      path: "authorisers",
      select: "firstName lastName email phone",
    });

    if (!mandate) {
      return res.status(404).json({
        message: "No mandate found for this amount",
        status: "failed",
      });
    }

    request.mandate = mandate._id;
    request.initiator = req.user._id;

    const result = await request.save();
    const notificationsToCreate = [];

    for (const authoriser of mandate.authorisers) {
      const notification = {
        title: "Transaction request Initiated",
        transaction: result._id,
        user: authoriser._id,
        message:
          "A transaction request was initiated and is awaiting your approval",
      };

      notificationsToCreate.push(notification);

      //Mail notification
      const subject = "Transaction Request Initiated";

      const message = {
        firstName: authoriser.firstName,
        message: `Dear ${authoriser.firstName}. The below request was initiated for your authorization.
          TransactionID: ${result._id} Amount: ${result.amount}
          `,
        year: new Date().getFullYear(),
      };

      await sendEmail(authoriser.email, subject, "transfer-request", message);
    }

    // send out notifications
    await notificationService.createNotifications(notificationsToCreate);

    // create audit trail
    const user = await userService.getUserById(req.user._id);
    const { date, time } = getDateAndTime();
    await auditTrailService.createAuditTrail({
      user: req.user._id,
      type: "transaction",
      transaction: result._id,
      message: `${user.firstName} ${user.lastName} initiated a transaction request on ${date} by ${time}`,
      organization: mine.organizationId,
    });

    return res.status(201).json({
      message: "Request initiated successfully and sent for approval",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      status: "failed",
    });
  }
};

const getAllInitiatorRequests = async (req, res) => {
  const { perPage, page, search, status } = req.query;

  const mine = await User.findById(req.user._id);
  const organizationId = mine.organizationId;

  const options = {
    page: page || 1,
    limit: perPage || PER_PAGE,
    sort: { createdAt: -1 },
  };

  const filter = {
    organizationId,
    initiator: mongoose.Types.ObjectId(req.user._id),
  };

  if (status) {
    filter.status = status;
  }

  if (search) {
    filter.$or = [
      {
        transactionReference: new RegExp(search, "i"),
      },
      ...(isNaN(search) ? [] : [{ amount: parseInt(search) }]),
    ];
  }

  try {
    const requests = await InitiateRequest.find(filter)
      .sort(options.sort)
      .skip(options.limit * (options.page - 1))
      .limit(options.limit * 1)
      .populate("mandate")
      .lean();

    const total = await InitiateRequest.countDocuments(filter);

    return res.status(200).json({
      message: "Request Successful",
      data: {
        requests,
        meta: {
          total,
          page: options.page,
          perPage: options.limit,
        },
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
};

const getAllAssignedRequests = async (req, res) => {
  const { perPage, page, search, status } = req.query;

  const options = {
    page: page || 1,
    limit: perPage || PER_PAGE,
    sort: { createdAt: -1 },
  };

  const query = {
    $or: [
      {
        "mandate.authorisers": {
          $in: [mongoose.Types.ObjectId(req.user._id)],
        },
      },
      {
        "mandate.verifier": mongoose.Types.ObjectId(req.user._id),
      },
    ],
  };

  if (search) {
    query.$and = [
      {
        $or: [
          {
            transactionReference: new RegExp(search, "i"),
          },
          ...(isNaN(search) ? [] : [{ amount: parseInt(search) }]),
        ],
      },
    ];
  }

  if (status) {
    query.status = status;
  }

  try {
    const requests = await InitiateRequest.aggregate([
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
        $match: query,
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
    return res.status(200).json({
      message: "Request Successful",
      data: {
        requests: requests[0].data,
        meta: requests[0].meta[0],
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
};

const getAllRequestPerOrganization = async (req, res) => {
  const { page, perPage, search, status, branchId } = req.query;
  const mine = await User.findById(req.user._id);
  const organizationId = branchId ?? mine.organizationId;

  const options = {
    page: page || 1,
    limit: perPage || PER_PAGE,
    sort: { createdAt: -1 },
  };

  const query = {
    organizationId: new mongoose.Types.ObjectId(organizationId),
  };

  if (status) {
    query.status = status;
  }

  if (search) {
    query.$or = [
      {
        transactionReference: { $regex: new RegExp(search, "i") },
      },
      ...(isNaN(search) ? [] : [{ amount: parseInt(search) }]),
    ];
  }

  try {
    const request = await InitiateRequest.aggregate([
      {
        $match: query,
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
        select: "maxAmount minAmount authorisers verifier",
        populate: [
          {
            path: "authorisers",
            model: "User",
            select: "firstName lastName",
          },
          {
            path: "verifier",
            model: "User",
            select: "firstName lastName",
          },
        ],
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

const declineRequest = async (req, res) => {
  const mine = await User.findById(req.user._id);
  try {
    const _id = req.params.id;
    const userId = req.user._id;

    const request = await InitiateRequest.findById(_id).populate("mandate");

    if (!request) {
      return res.status(404).json({
        message: "Request not found",
        status: "failed",
      });
    }

    const otpDetails = await Otp.findOne({
      otp: req.body.otp,
      user: userId,
      transaction: request._id,
    });

    if (!otpDetails) {
      return res.status(404).json({
        message: "OTP is incorrect or used",
        status: "failed",
      });
    }

    if (request.status === "approved") {
      return res.status(401).json({
        message:
          "You can no longer edit this request after the verifier has approved",
        status: "failed",
      });
    }

    let duplicate = false;
    for (let i = 0; i < request.authorisersAction.length; i++) {
      let transaction = request.authorisersAction[i];
      if (
        transaction.authoriserID == req.user._id &&
        transaction.status === "rejected"
      ) {
        return res.status(404).json({
          message: "You have already rejected this request",
          status: "failed",
        });
      } else if (
        transaction.authoriserID == req.user._id &&
        transaction.status === "authorised"
      ) {
        transaction.status = "rejected";
        transaction.reason = req.body.reason;
        duplicate = true;
      }
    }

    if (duplicate === false) {
      request.authorisersAction.push({
        status: "rejected",
        authoriserID: userId,
        reason: req.body.reason,
      });
    }

    await notificationService.createNotifications([
      {
        transaction: request._id,
        user: request.initiator,
        title: "Transaction Request Declined",
        message: `An authoriser has declined your transaction request for ${request.customerName}`,
        message: `An authoriser has declined your transaction request for ${request.customerName}`,
      },
      // {
      //   transaction: request._id,
      //   user: request.verifier,
      //   title: "Transaction Request Declined",
      //   message: `An authoriser declined transaction request for ${request.customerName}`,
      // },
    ]);

    request.status = "in progress";

    if (
      request.authorisersAction.length === request.mandate.numberOfAuthorisers
    ) {
      await notificationService.createNotifications([
        {
          transaction: request._id,
          user: request.mandate.verifier,
          title: "Verification Required",
          message: "New transaction request require your review",
        },
      ]);

      request.status = "awaiting verification";
    }

    // create audit trail
    const user = await User.findById(req.user._id);
    let dt = new Date(new Date().toISOString());
    let date = dt.toString().slice(0, 15);
    let time = dt.toString().slice(16, 21);

    let audit = await AuditTrail.create({
      user: req.user._id,
      type: "transaction",
      transaction: request._id,
      message: `${user.firstName} rejected a transaction request on ${date} by ${time}`,
      organization: mine.organization,
    });

    await audit.save();
    await Otp.findByIdAndDelete(otpDetails._id);
    await request.save();

    return res.status(200).json({
      message: "Request declined successfully",
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

const approveRequest = async (req, res) => {
  const mine = await User.findById(req.user._id);
  try {
    const _id = req.params.id;
    const userId = req.user._id;

    const request = await InitiateRequest.findById(_id).populate("mandate");

    if (!request) {
      return res.status(404).json({
        message: "Request not found",
        status: "failed",
      });
    }

    if (request.status === "approved") {
      return res.status(401).json({
        message:
          "You can no longer edit this request after the verifier has approved",
        status: "failed",
      });
    }

    const otpDetails = await Otp.findOne({
      otp: req.body.otp,
      user: userId,
      transaction: request._id,
    });

    if (!otpDetails) {
      return res.status(404).json({
        message: "OTP is incorrect or used",
        status: "failed",
      });
    }

    let duplicate = false;
    for (let i = 0; i < request.authorisersAction.length; i++) {
      let transaction = request.authorisersAction[i];
      if (
        transaction.authoriserID == req.user._id &&
        transaction.status === "authorised"
      ) {
        return res.status(404).json({
          message: "You have already approved this transaction",
          status: "failed",
        });
      } else if (
        transaction.authoriserID == req.user._id &&
        transaction.status === "rejected"
      ) {
        transaction.reason = req.body.reason;
        transaction.status = "authorised";
        duplicate = true;
      }
    }

    if (duplicate === false) {
      request.authorisersAction.push({
        status: "authorised",
        authoriserID: userId,
        reason: req.body.reason,
      });
    }

    await notificationService.createNotifications([
      {
        transaction: request._id,
        user: request.initiator,
        title: "Transaction Request Approved",
        message: `An authoriser has approved your transaction request for ${request.customerName}`,
      },
    ]);

    request.status = "in progress";

    if (
      request.authorisersAction.length == request.mandate.numberOfAuthorisers
    ) {
      await notificationService.createNotifications([
        {
          transaction: request._id,
          user: request.verifier,
          title: "Verification Required",
          message: "New transaction request require your review",
        },
      ]);
      request.status = "awaiting verification";

      //send mail to verifier
      const verifierInfo = await User.findById(request.mandate.verifier).select(
        "email firstName _id"
      );

      const subject = "Verification Required";

      const message = {
        firstName: verifierInfo.firstName,
        message: `Dear ${verifierInfo.firstName}. The below request was initiated for your verification.
            TransactionID: ${request._id} Amount: ${request.amount}
            `,
        year: new Date().getFullYear(),
      };

      await sendEmail(verifierInfo.email, subject, "transfer-request", message);
    }

    // create audit trail
    const user = await User.findById(req.user._id);
    let dt = new Date(new Date().toISOString());
    let date = dt.toString().slice(0, 15);
    let time = dt.toString().slice(16, 21);

    let audit = await AuditTrail.create({
      user: req.user._id,
      type: "transaction",
      transaction: request._id,
      message: `${user.firstName} authorised a transaction request on ${date} by ${time}`,
      organization: mine.organization,
    });

    await audit.save();
    await request.save();
    await Otp.findByIdAndDelete(otpDetails._id);

    return res.status(200).json({
      message: "Request approved successfully",
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

const verifierApproveRequest = async (req, res) => {
  const mine = await User.findById(req.user._id);
  const organization = await Account.findById(mine.organizationId);
  try {
    const _id = req.params.id;
    const userId = req.user._id;

    const request = await InitiateRequest.findById(_id).populate("mandate");

    if (!request) {
      return res.status(404).json({
        message: "Request not found",
        status: "failed",
      });
    }

    const otpDetails = await Otp.findOne({
      otp: req.body.otp,
      user: userId,
      transaction: request._id,
    });

    if (!otpDetails) {
      return res.status(404).json({
        message: "OTP is incorrect or used",
        status: "failed",
      });
    }

    // update and save request
    request.status = "approved";
    request.transferStatus = "disburse pending";
    request.verifierAction = {
      status: "approved",
      reason: req.body.reason,
    };
    await request.save();

    // notify initiator and authorizers
    const authorizers = request.mandate.authorisers;
    await notificationService.createNotifications([
      {
        transaction: request._id,
        user: request.initiator,
        title: "Request approved",
        message: `Your transaction request for ${request.customerName} has been approved`,
      },
      ...authorizers.map((authorizer) => ({
        transaction: request._id,
        user: authorizer,
        title: "Request approved",
        message: `Transaction request for ${request.customerName} has been approved`,
      })),
    ]);

    // create audit trail
    const user = await User.findById(req.user._id);
    const { date, time } = getDateAndTime();
    await auditTrailService.createAuditTrail({
      user: req.user._id,
      type: "transaction",
      transaction: request._id,
      message: `${user.firstName} approved a transaction request on ${date} by ${time}`,
      organization: mine.organizationId,
    });

    // delete otp from database
    await Otp.findByIdAndDelete(otpDetails._id);

    // update request date
    request.updatedAt = new Date();
    await request.save();

    // send request to bank one
    let transfer;
    if (request.type === "inter-bank") {
      const payload = {
        Amount: request.amount * 100,
        Payer: organization.accountName,
        PayerAccountNumber: request.payerAccountNumber,
        ReceiverAccountNumber: request.beneficiaryAccountNumber,
        ReceiverAccountType: request.beneficiaryAccountType,
        ReceiverBankCode: request.beneficiaryBankCode,
        ReceiverPhoneNumber: request.beneficiaryPhoneNumber,
        ReceiverName: request.beneficiaryBankName,
        ReceiverBVN: "",
        ReceiverKYC: "",
        TransactionReference: request.transactionReference,
        NIPSessionID: request.NIPSessionID,
        Token: authToken,
        Narration: request.narration,
      };

      transfer = await bankOneService.doInterBankTransfer(payload);
    } else {
      const payload = {
        Amount: request.amount * 100,
        RetrievalReference: request.transactionReference,
        FromAccountNumber: request.payerAccountNumber,
        ToAccountNumber: request.beneficiaryAccountNumber,
        AuthenticationKey: authToken,
        Narration: request.narration,
      };
      transfer = await bankOneService.doIntraBankTransfer(payload);
    }

    if (transfer?.Status === "Successful" || transfer?.ResponseCode === "00") {
      request.transferStatus = "successful";
      request.meta = transfer;
      await request.save();
    } else if (
      transfer?.Status === "Pending" ||
      ["91", "06"].includes(transfer?.ResponseCode)
    ) {
      request.meta = transfer;
      request.updatedAt = new Date();
      await request.save();
    } else {
      request.meta = transfer;
      request.updatedAt = new Date();
      request.transferStatus = "failed";
      await request.save();
    }
    return res.status(200).json({
      message: "Request approved successfully",
      status: "success",
      meta: transfer,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error,
      status: "failed",
    });
  }
};

const verifierDeclineRequest = async (req, res) => {
  try {
    const _id = req.params.id;
    const userId = req.user._id;

    const request = await InitiateRequest.findById(_id).populate("mandate");

    // find request
    if (!request) {
      return res.status(404).json({
        message: "Request not found",
        status: "failed",
      });
    }

    // find and validate otp
    const otpDetails = await Otp.findOne({
      otp: req.body.otp,
      user: userId,
      transaction: request._id,
    });

    if (!otpDetails) {
      return res.status(404).json({
        message: "OTP is incorrect or used",
        status: "failed",
      });
    }

    // update request
    request.status = "declined";
    request.verifierAction = {
      status: "declined",
      reason: req.body.reason,
    };
    await request.save();

    // create notifications
    const authorizers = request.mandate.authorisers;
    await notificationService.createNotifications([
      {
        transaction: request._id,
        user: request.initiator,
        title: "Request not Verified",
        message: `Your transaction request for ${request.customerName} has been declined`,
      },
      ...authorizers.map((authorizer) => ({
        transaction: request._id,
        user: authorizer,
        title: "Request not Verified",
        message: `Transaction request for ${request.customerName} has been declined`,
      })),
    ]);

    // delete otp from the database completely
    await Otp.findByIdAndDelete(otpDetails._id);

    return res.status(200).json({
      message: "Request declined successfully",
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

const getAwaitingVerificationRequest = async (req, res) => {
  const { page, perPage, status, search } = req.query;
  const options = {
    page: page || 1,
    limit: perPage || PER_PAGE,
    sort: { createdAt: -1 },
  };

  const matchStage = {
    status: status || {
      $in: ["pending", "in progress", "awaiting verification"],
    },
  };

  if (search) {
    matchStage.$or = [
      { transactionReference: new RegExp(search, "i") },
      ...(isNaN(search) ? [] : [{ amount: parseInt(search) }]),
    ];
  }

  try {
    const requests = await InitiateRequest.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "mandates",
          localField: "mandate",
          foreignField: "_id",
          as: "mandate",
        },
      },
      { $unwind: "$mandate" },
      {
        $facet: {
          data: [
            { $sort: options.sort },
            { $skip: options.limit * (options.page - 1) },
            { $limit: options.limit },
          ],
          meta: [
            { $count: "total" },
            {
              $addFields: {
                page: options.page,
                perPage: options.limit,
              },
            },
          ],
        },
      },
      { $unwind: "$meta" },
    ]);

    return res.status(200).json({
      message: "Request fetched successfully",
      status: "success",
      data: {
        requests: requests[0]?.data || [],
        meta: requests[0]?.meta || {},
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error.message,
      status: "failed",
    });
  }
};

const getRequestSentToBankOne = async (req, res) => {
  const { page, perPage, search, status } = req.query;
  const options = {
    page: page || 1,
    limit: perPage || PER_PAGE,
    sort: { createdAt: -1 },
  };

  const matchStage = {
    transferStatus: { $in: ["disburse pending", "pending", "in progress"] },
  };

  if (search) {
    matchStage.$or = [
      { transactionReference: new RegExp(search, "i") },
      ...(isNaN(search) ? [] : [{ amount: parseInt(search) }]),
    ];
  }

  if (status) {
    matchStage.status = status;
  }

  try {
    const request = await InitiateRequest.aggregate([
      { $match: matchStage },
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
        $lookup: {
          from: "accounts",
          localField: "organizationId",
          foreignField: "_id",
          as: "originatingAccount",
        },
      },
      {
        $unwind: "$originatingAccount",
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
      {
        $unwind: "$meta",
      },
    ]);
    return res.status(200).json({
      message: "Request fetched successfully",
      status: "success",
      data: {
        requests: request[0]?.data || [],

        meta: request[0]?.meta || {},
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error.message,
      status: "failed",
    });
  }
};

const approveBulkRequest = async (req, res) => {
  const mine = await User.findById(req.user._id);
  try {
    const transactionIds = req.body.transactionIds;

    const requests = await InitiateRequest.find({
      _id: { $in: transactionIds },
    }).populate("mandate");

    const batchVerificationIds = requests.map((r) => r.batchVerificationID);
    const allSame = batchVerificationIds.every(
      (v) => v === batchVerificationIds[0]
    );

    if (!allSame) {
      return res.status(400).json({
        message: "All transactions must have the same batch verification ID",
        status: "failed",
      });
    }

    const errors = [];
    const auditMessages = [];
    const notificationMessages = [];
    const verifierIds = [];
    const verifiers_message = [];

    await Promise.all(
      requests.map(async (request) => {
        if (request.status === "approved") {
          errors.push({
            message: `Transaction ${request._id} has already been approved`,
          });
          return;
        }

        const otpDetails = await Otp.findOne({
          otp: req.body.otp,
          user: req.user._id,
          transaction: mongoose.Types.ObjectId(request.batchVerificationID),
        });

        if (!otpDetails) {
          errors.push({
            message: `OTP is incorrect or used for transaction ${request._id}`,
          });
          return;
        }

        let duplicate = false;
        for (let i = 0; i < request.authorisersAction.length; i++) {
          let transaction = request.authorisersAction[i];
          if (
            transaction.authoriserID == req.user._id &&
            transaction.status === "authorised"
          ) {
            errors.push({
              message: `You have already approved transaction ${request._id}`,
            });
            duplicate = true;
            break;
          } else if (
            transaction.authoriserID == req.user._id &&
            transaction.status === "rejected"
          ) {
            transaction.reason = req.body.reason;
            transaction.status = "authorised";
            duplicate = true;
          }
        }

        if (duplicate === false) {
          request.authorisersAction.push({
            status: "authorised",
            authoriserID: req.user._id,
            reason: req.body.reason,
          });
        }

        verifierIds.push(request.mandate.verifier);

        // send notification to verifier
        notificationMessages.push({
          transaction: requests[0].batchVerificationID,
          user: request.initiator,
          title: "Transaction Request Approved",
          message: `An authoriser has approved your transaction request for ${request.mandate.accountName}`,
        });

        request.status = "in progress";

        if (
          request.authorisersAction.length ==
          request.mandate.numberOfAuthorisers
        ) {
          // send notification to verifier
          notificationMessages.push({
            transaction: requests[0].batchVerificationID,
            user: request.mandate.verifier,
            title: "Verification Required",
            message: "New transaction request requires your review",
          });

          request.status = "awaiting verification";

          // send email to verifier
          const verifierInfo = await User.findById(
            request.mandate.verifier
          ).select("email firstName _id");
          if (verifierInfo) {
            const message = {
              firstName: verifierInfo.firstName,
              message: `Dear ${verifierInfo.firstName}. The below request was initiated for your verification.
              TransactionID: ${request._id} Amount: ${request.amount}
              `,
              year: new Date().getFullYear(),
            };

            verifiers_message.push({
              receiver: verifierInfo.email,
              subject: "Verification Required",
              title: "transfer-request",
              message: message,
            });
          }
        }

        // create audit trail message
        auditMessages.push(
          `${req.user.firstName} authorised a transaction request for ${request.customerName}`
        );

        request.save();
        await Otp.findByIdAndDelete(otpDetails._id);
      })
    );

    if (verifiers_message.length > 0) {
      sendEmail(
        verifiers_message[0].receiver,
        "Verification Required",
        "transfer-request",
        verifiers_message[0].message
      );
    }

    // create audit trail message
    if (auditMessages.length > 0) {
      const user = await User.findById(req.user._id);
      let dt = new Date(new Date().getTime() + 60 * 60 * 1000 * 3);
      let auditTrailMessage = {
        date: dt,
        user: req.user._id,
        message: auditMessages[0],
        type: "authorisation",
      };
      await AuditTrail.create(auditTrailMessage);
    }

    // send notifications
    if (notificationMessages.length > 0) {
      await notificationService.createNotifications([
        {
          transaction: notificationMessages[0].transaction,
          user: notificationMessages[0].user,
          title: "Verification Required",
          message: "New transaction request require your review",
        },
      ]);
    }

    // send emails
    if (notificationMessages.length > 0) {
      const verifierInfo = await User.findById(
        notificationMessages[0].user
      ).select("email firstName _id");
      const message = {
        firstName: verifierInfo.firstName,
        message: `Dear ${verifierInfo.firstName}. The below request was initiated for your verification.
          TransactionID: ${notificationMessages[0].transaction} `,
        year: new Date().getFullYear(),
      };
      await sendEmail(
        verifierInfo.email,
        notificationMessages[0].title,
        "transfer-request",
        message
      );
    }

    return res.status(200).json({
      message: "Transactions approved successfully",
      status: "success",
      errors: errors,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error.message,
      status: "failed",
    });
  }
};

const verifierBulkaprove = async (req, res) => {
  try {
    const mine = await User.findById(req.user._id);
    const organization = await Account.findById(mine.organizationId);
    const transactionIds = req.body.transactions;
    const userId = req.user._id;
    let transfer;

    const requests = await InitiateRequest.find({
      _id: { $in: transactionIds },
    }).populate("mandate");

    const requestsByBatchVerificationId = requests.reduce(
      (accumulator, request) => {
        const batchVerificationId = request.batchVerificationID.toString();
        accumulator[batchVerificationId] =
          accumulator[batchVerificationId] || [];
        accumulator[batchVerificationId].push(request);
        return accumulator;
      },
      {}
    );

    const batchVerificationId = req.body.batchId;

    if (!batchVerificationId) {
      return res
        .status(400)
        .json({ message: "Batch verification ID is required", success: false });
    }

    if (!(batchVerificationId in requestsByBatchVerificationId)) {
      return res.status(400).json({
        message: `No transactions found for batch verification ID ${batchVerificationId}`,
        success: false,
      });
    }

    const requestsToApprove =
      requestsByBatchVerificationId[batchVerificationId];

    const otpDetails = await Otp.findOne({
      otp: req.body.otp,
      user: userId,
      transaction: req.body.batchId,
    });

    if (!otpDetails) {
      return res.status(404).json({
        message: "OTP is incorrect or used",
        status: "failed",
      });
    }

    requestsToApprove.map(async (request) => {
      // update and save request

      request.status = "approved";
      request.transferStatus = "disburse pending";
      request.verifierAction = {
        status: "approved",
        reason: req.body.reason,
      };
      await request.save();

      // add notification and audit trail to arrays
      const authorizers = request.mandate.authorisers;

      await notificationService.createNotifications([
        {
          transaction: request._id,
          user: request.initiator,
          title: "Request approved",
          message: `Your transaction request for ${request.mandate.accountName} has been approved`,
        },
        ...authorizers.map((authorizer) => ({
          transaction: request._id,
          user: authorizer,
          title: "Request approved",
          message: `Transaction request for ${request.mandate.accountName} has been approved`,
        })),
      ]);

      // create audit trail
      const user = await User.findById(req.user._id);
      const { date, time } = getDateAndTime();
      await auditTrailService.createAuditTrail({
        user: req.user._id,
        type: "transaction",
        transaction: request._id,
        message: `${user.firstName} approved a transaction request on ${date} by ${time}`,
        organization: mine.organizationId,
      });

      // delete otp from database
      await Otp.findByIdAndDelete(otpDetails._id);

      // update request date
      request.updatedAt = new Date();
      await request.save();

      // send request to bank one

      if (request.type === "inter-bank") {
        const payload = {
          Amount: request.amount * 100,
          Payer: organization.accountName,
          PayerAccountNumber: request.payerAccountNumber,
          ReceiverAccountNumber: request.beneficiaryAccountNumber,
          ReceiverAccountType: request.beneficiaryAccountType,
          ReceiverBankCode: request.beneficiaryBankCode,
          ReceiverPhoneNumber: request.beneficiaryPhoneNumber,
          ReceiverName: request.beneficiaryBankName,
          ReceiverBVN: "",
          ReceiverKYC: "",
          TransactionReference: request.transactionReference,
          NIPSessionID: request.NIPSessionID,
          Token: authToken,
          Narration: request.narration,
        };

        transfer = await bankOneService.doInterBankTransfer(payload);
      } else {
        const payload = {
          Amount: request.amount * 100,
          RetrievalReference: request.transactionReference,
          FromAccountNumber: request.payerAccountNumber,
          ToAccountNumber: request.beneficiaryAccountNumber,
          AuthenticationKey: authToken,
          Narration: request.narration,
        };
        transfer = await bankOneService.doIntraBankTransfer(payload);
      }

      if (
        transfer?.Status === "Successful" ||
        transfer?.ResponseCode === "00"
      ) {
        request.meta = transfer;
        request.transferStatus = "successful";
        await request.save();
      } else if (transfer?.Status === "Failed") {
        request.meta = transfer;
        request.transferStatus = "failed";
        request.updatedAt = new Date();
        await request.save();
      } else {
        request.meta = transfer;
        request.updatedAt = new Date();
        await request.save();
      }
    });

    return res.status(200).json({
      message: "Request approved successfully",
      status: "success",
      meta: transfer,
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
  initiateRequest,
  declineRequest,
  approveRequest,
  getAllInitiatorRequests,
  getAllRequestPerOrganization,
  getRequestById,
  getAllAssignedRequests,
  verifierDeclineRequest,
  verifierApproveRequest,
  getAwaitingVerificationRequest,
  getRequestSentToBankOne,
  approveBulkRequest,
  verifierBulkaprove,
};
