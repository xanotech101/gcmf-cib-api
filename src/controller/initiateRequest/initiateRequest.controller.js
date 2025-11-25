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
const Account = require("../../model/account");
const {
  publishTransfer,
} = require("../../services/messageQueue/transfer/publisher");
const logger = require("../../utils/logger");

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

    const account = await Account.findById(mine.organizationId.toString());

    const mandate = await Mandate.findOne({
      organizationId: mine.organizationId.toString(),
      minAmount: { $lte: request.amount },
      maxAmount: { $gte: request.amount },
    }).populate({
      path: "verifiers",
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
    request.narration = (
      "Transfer from " +
      account?.accountName +
      " to " +
      req.body.beneficiaryAccountName +
      "\\\\" +
      req.body.narration
    )?.slice(0, 100);

    // the organization label from the organizationId to add the request
    const getOrganizationLabel = await Account.findOne({
      _id: mine.organizationId,
    }).select("organizationLabel");
    if (getOrganizationLabel.organizationLabel !== null) {
      request.organizationLabel = getOrganizationLabel.organizationLabel;
    }
    const result = await request.save();
    const notificationsToCreate = [];

    for (const verifier of mandate.verifiers) {
      const notification = {
        title: "Transaction request Initiated",
        identifier: result._id,
        user: verifier._id,
        message:
          "A transaction request was initiated and is awaiting your approval",
      };

      notificationsToCreate.push(notification);

      //Mail notification
      const subject = "Transaction Request Initiated";

      const message = {
        firstName: verifier.firstName,
        message:
          "The below request was initiated for your verification. Kindly login to your account to review",
        amount: result.amount,
        reference: result.transactionReference,
        year: new Date().getFullYear(),
      };

      await sendEmail(verifier.email, subject, "transfer-request", message);
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
      organizationLabel: mine.organizationLabel,
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
    sort: { _id: -1 },
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
    sort: { _id: -1 },
  };

  const query = {
    $or: [
      {
        "mandate.verifiers": {
          $in: [mongoose.Types.ObjectId(req.user._id)],
        },
      },
      {
        "mandate.authoriser": mongoose.Types.ObjectId(req.user._id),
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
    page: parseInt(page) || 1,
    limit: parseInt(perPage) || PER_PAGE,
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
    const total = await InitiateRequest.countDocuments(query);

    const skipCount = (options.page - 1) * options.limit;
    const requests = await InitiateRequest.find(query)
      .sort({ _id: -1 })
      .skip(skipCount)
      .limit(options.limit)
      .populate("mandate");

    res.status(200).json({
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
    res.status(500).json({ message: error.message });
  }
};

const getRequestById = async (req, res) => {
  try {
    const _id = req.params.id;
    const request = await InitiateRequest.findOne({ _id })
      .populate({
        path: "mandate",
        select: "maxAmount minAmount authoriser verifiers",
        populate: [
          {
            path: "authoriser",
            model: "User",
            select: "firstName lastName",
          },
          {
            path: "verifiers",
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
  const user = await User.findById(req.user._id);
  try {
    const _id = req.params.id;
    const request = await InitiateRequest.findById(_id).populate("mandate");

    if (!request) {
      return res.status(404).json({
        message: "Request not found",
        status: "failed",
      });
    }

    const otpDetails = await Otp.findOne({
      otp: req.body.otp,
      user: user._id,
      transaction: request._id,
    });

    if (!otpDetails) {
      return res.status(404).json({
        message: "OTP is incorrect or used",
        status: "failed",
      });
    }

    if (request.status === InitiateRequest.APPROVAL_STATUS.APPROVED) {
      return res.status(401).json({
        message:
          "You can no longer edit this request after the verifier has approved",
        status: "failed",
      });
    }

    const userAction = request.verifiersAction.find(
      ({ verifierID }) => verifierID == user._id
    );

    if (userAction) {
      if (userAction.status === "rejected") {
        return res.status(404).json({
          message: "You have already rejected this request",
          status: "failed",
        });
      }
      if (userAction.status === "verified") {
        userAction.status = "rejected";
        userAction.reason = req.body.reason;
      }
    } else {
      request.verifiersAction.push({
        status: "rejected",
        verifierID: user._id,
        reason: req.body.reason,
      });
    }

    await notificationService.createNotifications([
      {
        identifier: request._id,
        user: request.initiator,
        title: "Transaction Request Declined",
        message: `A verifier has declined your transaction request for ${request.beneficiaryAccountName}`,
      },
    ]);

    request.status = InitiateRequest.APPROVAL_STATUS.IN_PROGRESS;

    if (request.verifiersAction.length === request.mandate.numberOfVerifiers) {
      await notificationService.createNotifications([
        {
          identifier: request._id,
          user: request.mandate.authoriser,
          title: "Authorization Required",
          message: "New transaction request require your review",
        },
      ]);

      request.status = InitiateRequest.APPROVAL_STATUS.AWAITING_AUTHORIZATION;

      //send mail to authoriser
      const authoriserInfo = await User.findById(
        request.mandate.authoriser
      ).select("email firstName _id");

      const subject = "Authorization Required";

      const message = {
        firstName: authoriserInfo.firstName,
        amount: request.amount,
        reference: request.transactionReference,
        message:
          "The below request requires your authorization. Kindly login to your account to review",
        year: new Date().getFullYear(),
      };

      await sendEmail(
        authoriserInfo.email,
        subject,
        "transfer-request",
        message
      );
    }

    // create audit trail
    let dt = new Date(new Date().toISOString());
    let date = dt.toString().slice(0, 15);
    let time = dt.toString().slice(16, 21);

    let audit = await AuditTrail.create({
      user: user._id,
      type: "transaction",
      transaction: request._id,
      message: `${user.firstName} rejected a transaction request on ${date} by ${time}`,
      organization: user.organizationId,
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
          "You can no longer edit this request after the authoriser has approved",
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
    for (let i = 0; i < request.verifiersAction.length; i++) {
      let transaction = request.verifiersAction[i];
      if (
        transaction.verifierID == req.user._id &&
        transaction.status === "verified"
      ) {
        return res.status(404).json({
          message: "You have already approved this transaction",
          status: "failed",
        });
      } else if (
        transaction.verifierID == req.user._id &&
        transaction.status === "rejected"
      ) {
        transaction.reason = req.body.reason;
        transaction.status = "verified";
        duplicate = true;
      }
    }

    if (duplicate === false) {
      request.verifiersAction.push({
        status: "verified",
        verifierID: userId,
        reason: req.body.reason,
      });
    }

    await notificationService.createNotifications([
      {
        identifier: request._id,
        user: request.initiator,
        title: "Transaction Request Approved",
        message: `A verifier has approved your transaction request for ${request.beneficiaryAccountName}`,
      },
    ]);

    request.status = InitiateRequest.APPROVAL_STATUS.IN_PROGRESS;

    if (request.verifiersAction.length == request.mandate.numberOfVerifiers) {
      await notificationService.createNotifications([
        {
          identifier: request._id,
          user: request.mandate.authoriser,
          title: "Authorization Required",
          message: "New transaction request require your review",
        },
      ]);
      request.status = InitiateRequest.APPROVAL_STATUS.AWAITING_AUTHORIZATION;

      //send mail to authoriser
      const authoriserInfo = await User.findById(
        request.mandate.authoriser
      ).select("email firstName _id");

      const subject = "Authorization Required";

      const message = {
        firstName: authoriserInfo.firstName,
        amount: request.amount,
        reference: request.transactionReference,
        message:
          "The below request requires your authorization. Kindly login to your account to review",
        year: new Date().getFullYear(),
      };

      await sendEmail(
        authoriserInfo.email,
        subject,
        "transfer-request",
        message
      );
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
      message: `${user.firstName} verified a transaction request on ${date} by ${time}`,
      organization: mine.organizationId,
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

const authoriserApproveRequest = async (req, res) => {
  const user = await User.findById(req.user._id);
  const accountInfo = await Account.findById(user.organizationId);
  try {
    const _id = req.params.id;
    const request = await InitiateRequest.findById(_id).populate("mandate");

    if (!request) {
      return res.status(404).json({
        message: "Request not found",
        status: "failed",
      });
    }

    const otpDetails = await Otp.findOne({
      otp: req.body.otp,
      user: user._id,
      transaction: request._id,
    });

    if (!otpDetails) {
      return res.status(404).json({
        message: "OTP is incorrect or used",
        status: "failed",
      });
    }

    if (request.transferStatus !== InitiateRequest.TRANSFER_STATUS.PENDING) {
      logger.warn({ requestId: request._id }, "Transaction not approved");
      return;
    }

    request.status = InitiateRequest.APPROVAL_STATUS.APPROVED;
    request.transferStatus = InitiateRequest.TRANSFER_STATUS.QUEUED;

    request.authoriserAction = {
      status: "approved",
      reason: req.body.reason,
    };
    await request.save();

    const verifiers = request.mandate.verifiers;
    await notificationService.createNotifications([
      {
        identifier: request._id,
        user: request.initiator,
        title: "Request approved",
        message: `Your transaction request for ${request.beneficiaryAccountName} has been approved`,
      },
      ...verifiers.map((verifier) => ({
        transaction: request._id,
        user: verifier,
        title: "Request approved",
        message: `Transaction request for ${request.beneficiaryAccountName} has been approved`,
      })),
    ]);

    const { date, time } = getDateAndTime();
    await auditTrailService.createAuditTrail({
      user: user._id,
      type: "transaction",
      transaction: request._id,
      message: `${user.firstName} approved a transaction request on ${date} by ${time}`,
      organization: user.organizationId,
      organizationLabel: user.organizationLabel,
    });

    await Otp.findByIdAndDelete(otpDetails._id);
    await publishTransfer([
      {
        originatingAccount: accountInfo.accountName,
        transactionId: request._id,
      },
    ]);

    return res.status(200).json({
      message: "Request approved successfully",
      status: "success",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error,
      status: "failed",
    });
  }
};

const authoriserDeclineRequest = async (req, res) => {
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
    request.authoriserAction = {
      status: "declined",
      reason: req.body.reason,
    };
    await request.save();

    // create notifications
    const verifiers = request.mandate.verifiers;
    await notificationService.createNotifications([
      {
        identifier: request._id,
        user: request.initiator,
        title: "Request not Authorised",
        message: `Your transaction request for ${request.beneficiaryAccountName} has been declined`,
      },
      ...verifiers.map((verifier) => ({
        transaction: request._id,
        user: verifier,
        title: "Request not Authorised",
        message: `Transaction request for ${request.beneficiaryAccountName} has been declined`,
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

const getAllTransferRequests = async (req, res) => {
  const { page, perPage, search, status } = req.query;
  const options = {
    page: page || 1,
    limit: perPage || PER_PAGE,
    sort: { _id: -1 },
  };

  const matchStage = {};

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
          as: "organization",
          pipeline: [{ $project: { accountName: 1 } }],
        },
      },
      {
        $unwind: "$organization",
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

    const { data, meta } = request[0] || {};
    return res.status(200).json({
      message: "Request fetched successfully",
      status: "success",
      data: {
        requests: data || [],
        meta: meta || {},
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
  try {
    const errors = [];
    const auditMessages = [];
    const notificationMessages = [];
    const verifierIds = [];
    const authorisers_message = [];

    const transactionIds = req.body.transactionIds;
    const requests = await InitiateRequest.find({
      _id: { $in: transactionIds },
    }).populate("mandate");

    const otpDetails = await Otp.findOne({
      otp: req.body.otp,
      user: req.user._id,
      transaction: req.body.batchVerificationID,
    });

    if (!otpDetails) {
      errors.push({
        message: `OTP is incorrect or used for batch verification`,
      });
      return res.status(400).json({
        message: "OTP is incorrect or used for batch verification",
        status: "failed",
        errors,
      });
    }

    await Promise.all(
      requests.map(async (request) => {
        try {

          if (request.status === InitiateRequest.APPROVAL_STATUS.APPROVED) {
            errors.push({
              message: `Transaction ${request._id} has already been approved`,
            });
            return;
          }

          const userAction = request.verifiersAction.find(
            (action) => action.verifierID == req.user._id
          );
          if (userAction) {
            if (userAction.status === "verified") {
              errors.push({
                message: `You have already approved transaction ${request._id}`,
              });
              return;
            }
            if (userAction.status === "rejected") {
              userAction.reason = req.body.reason;
              userAction.status = "verified";
            }
          } else {
            request.verifiersAction.push({
              status: "verified",
              verifierID: req.user._id,
              reason: req.body.reason,
            });
          }

          verifierIds.push(request.mandate.authoriser);

          notificationMessages.push({
            transaction: req.body.batchVerificationID,
            user: request.initiator,
            title: "Transaction Request Approved",
            message: `A verifier has approved your transaction request for ${request.mandate.accountName}`,
          });

          request.status = InitiateRequest.APPROVAL_STATUS.IN_PROGRESS;

          if (
            request.verifiersAction.length == request.mandate.numberOfVerifiers
          ) {
            notificationMessages.push({
              transaction: req.body.batchVerificationID,
              user: request.mandate.authoriser,
              title: "Authorization Required",
              message: "New transaction request requires your review",
            });

            request.status =
              InitiateRequest.APPROVAL_STATUS.AWAITING_AUTHORIZATION;

            const authoriserInfo = await User.findById(
              request.mandate.authoriser
            ).select("email firstName _id");

            if (authoriserInfo) {
              const message = {
                firstName: authoriserInfo.firstName,
                message:
                  "The below request requires your authorization. Kindly login to your account to review",
                amount: request.amount,
                reference: request.transactionReference,
                year: new Date().getFullYear(),
              };

              authorisers_message.push({
                receiver: authoriserInfo.email,
                subject: "Authorization Required",
                title: "transfer-request",
                message: message,
              });
            }
          }

          auditMessages.push(
            `${req.user.firstName} verified a transaction request for ${request.beneficiaryAccountName}`
          );

          await request.save();
        } catch (error) {
          console.log(
            `Error updating status for request ${request._id}:`,
            error
          );
        }
      })
    );

    await Otp.findByIdAndDelete(otpDetails._id);

    const uniqueNotifications = [];
    const notificationUserSet = new Set();
    for (const n of notificationMessages) {
      const key = `${n.user}`;
      if (!notificationUserSet.has(key)) {
        uniqueNotifications.push(n);
        notificationUserSet.add(key);
      }
    }

    if (uniqueNotifications.length > 0) {
      await notificationService.createNotifications(uniqueNotifications);
    }

    const uniqueEmails = [];
    const emailUserSet = new Set();
    for (const e of authorisers_message) {
      const key = `${e.receiver}`;
      if (!emailUserSet.has(key)) {
        uniqueEmails.push(e);
        emailUserSet.add(key);
      }
    }
    for (const email of uniqueEmails) {
      await sendEmail(
        email.receiver,
        email.subject,
        email.title,
        email.message
      );
    }

    if (auditMessages.length > 0) {
      let dt = new Date(new Date().getTime() + 60 * 60 * 1000 * 3);
      let auditTrailMessage = {
        date: dt,
        user: req.user._id,
        message: auditMessages[0],
        type: "verification",
      };
      await AuditTrail.create(auditTrailMessage);
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

const authoriserBulkApprove = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const organization = await Account.findById(user.organizationId);
    const transactionIds = req.body.transactions;

    const requests = await InitiateRequest.find({
      _id: { $in: transactionIds },
    }).populate("mandate");

    // const otpDetails = await Otp.findOne({
    //   otp: req.body.otp,
    //   user: user._id,
    //   transaction: req.body.batchId,
    // });

    // if (!otpDetails) {
    //   return res.status(404).json({
    //     message: "OTP is incorrect or used",
    //     status: "failed",
    //   });
    // }

    // await Otp.findByIdAndDelete(otpDetails._id);
    const transfersToQueue = [];

    await Promise.all(
      requests.map(async (request) => {
        if (
          request.transferStatus !== InitiateRequest.TRANSFER_STATUS.PENDING
        ) {
          logger.warn(
            { requestId: request._id },
            "Transaction already processed"
          );
          return;
        }

        request.status = InitiateRequest.APPROVAL_STATUS.APPROVED;
        request.updatedAt = new Date();
        request.transferStatus = InitiateRequest.TRANSFER_STATUS.QUEUED;

        request.authoriserAction = {
          status: "approved",
          reason: req.body.reason,
        };

        await request.save();

        const verifiers = request.mandate.verifiers;

        await notificationService.createNotifications([
          {
            identifier: request._id,
            user: request.initiator,
            title: "Request approved",
            message: `Your transaction request for ${request.mandate.accountName} has been approved`,
          },
          ...verifiers.map((verifier) => ({
            transaction: request._id,
            user: verifier,
            title: "Request approved",
            message: `Transaction request for ${request.mandate.accountName} has been approved`,
          })),
        ]);

        const { date, time } = getDateAndTime();

        await auditTrailService.createAuditTrail({
          user: req.user._id,
          type: "transaction",
          transaction: request._id,
          message: `${user.firstName} approved a transaction request on ${date} by ${time}`,
          organization: user.organizationId,
          organizationLabel: user.organizationLabel,
        });

        transfersToQueue.push({
          originatingAccount: organization.accountName,
          transactionId: request._id,
        });
      })
    );
    await publishTransfer(transfersToQueue, 'bulk');
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

module.exports = {
  initiateRequest,
  declineRequest,
  approveRequest,
  getAllInitiatorRequests,
  getAllRequestPerOrganization,
  getRequestById,
  getAllAssignedRequests,
  authoriserApproveRequest,
  authoriserDeclineRequest,
  getAllTransferRequests,
  approveBulkRequest,
  authoriserBulkApprove,
};
