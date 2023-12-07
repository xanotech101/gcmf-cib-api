const { default: mongoose } = require("mongoose");
const Account = require("../model/account");
const organization = require("../model/organization");
const userModel = require("../model/user.model");
const InitiateRequest = require("../model/initiateRequest.model");
const { getMonthName } = require("./external/externalcontroller");
const Audit = require("../model/auditTrail");

async function getAllusersTiedToGCAccount(req, res) {
  try {
    // Get gc organization label
    const requestlabel = await organization.findOne({
      _id: req.user.organizationLabel,
    });
    if (!requestlabel) {
      return res.status(400).send({
        success: false,
        message: "No organization with that label",
      });
    }

    // Get all accounts tied to the gc organization label
    const request_accounts = await Account.find({
      organizationLabel: requestlabel._id,
    });
    if (!request_accounts || request_accounts.length === 0) {
      return res.status(400).send({
        success: false,
        message: "No account registered with this organization yet",
      });
    }

    // Filter by firstName, lastName, and email
    const search = req.query.search;

    const filter = {
      organizationId: { $in: request_accounts.map((account) => account._id) },
    };

    if (search) {
      const trimmedSearch = search.trim();
      filter.$or = [
        { firstName: { $regex: new RegExp(trimmedSearch, "i") } },
        { lastName: { $regex: new RegExp(trimmedSearch, "i") } },
        { email: { $regex: new RegExp(trimmedSearch, "i") } },
        {
          $expr: {
            $regexMatch: {
              input: { $concat: ["$firstName", " ", "$lastName"] },
              regex: new RegExp(trimmedSearch, "i"),
            },
          },
        },
      ];
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalCount = await userModel.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limit);

    const request_users = await userModel
      .find(filter)
      .skip(skip)
      .limit(limit)
      .populate("privileges");

    return res.status(200).send({
      success: true,
      message: "Users fetched successfully",
      data: {
        users: request_users,
      },
      currentPage: page,
      totalPages: totalPages,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
}

async function getAllusersTiedToAnAccount(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10; // Set the desired number of users per page

    const totalCount = await userModel.countDocuments({
      organizationId: req.params.account,
    });

    const totalPages = Math.ceil(totalCount / limit);

    const skip = (page - 1) * limit;

    const users = await userModel
      .find({ organizationId: req.params.account })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      message: "Users tied to this account",
      data: {
        users,
      },
      currentPage: page,
      totalPages: totalPages,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
}

const dashBoardAnalytics = async (req, res) => {
  //Get all gc accounts
  const requestlabel = await organization.findOne({  _id: req.user.organizationLabel });
  if (!requestlabel) {
    return res.status(400).send({
      success: false,
      message: "no organization with that label",
    });
  }
  //get all accounts tied to the gc organization lable
  const totalAccounts = await Account.countDocuments({
    organizationLabel: requestlabel._id,
  });

  // get all users tied to gc accounts
  //get all accounts tied to the gc organization lable
  const request_accounts = await Account.find({
    organizationLabel: requestlabel._id,
  });

  const AllUsers = [];
  if (request_accounts.length > 0) {
    for (const account of request_accounts) {
      const users = await userModel.find({ organizationId: account._id });
      AllUsers.push(...users);
    }
  }
  const totalUsers = AllUsers.length;

  const AllTransfers = [];
  if (request_accounts.length > 0) {
    for (const account of request_accounts) {
      const transfers = await InitiateRequest.find({
        organizationId: account._id,
        transferStatus: {
          $in: ["successful", "failed", "pending", "disburse pending"],
        },
      });
      AllTransfers.push(...transfers);
    }
  }

  const totalTransfers = AllTransfers.length;

  return res.status(200).json({
    data: {
      totalAccounts,
      totalUsers,
      totalTransfers,
    },
    status: "success",
  });
};

const transferRequest = async (req, res) => {
  try {
    // Get gc organization label
    const requestlabel = await organization.findOne({
      _id: req.user.organizationLabel,
    });
    if (!requestlabel) {
      return res.status(400).send({
        success: false,
        message: "No organization with that label",
      });
    }

    // Get all accounts tied to the gc organization label
    const request_accounts = await Account.find({
      organizationLabel: requestlabel._id,
    });
    if (!request_accounts || request_accounts.length === 0) {
      return res.status(400).send({
        success: false,
        message: "No account registered with this organization yet",
      });
    }

    // Fetch transfers from InitiateRequest model for each request_accounts._id with search filter and pagination
    const page = req.query.page || 1; // Current page number
    const limit = req.query.perPage || 10; // Number of transfers per page
    const status = req.query.status;
    const search = req.query.search;

    const query = {
      organizationId: { $in: request_accounts.map((account) => account._id) },
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

    const count = await InitiateRequest.countDocuments(query);
    const transfers = await InitiateRequest.find(query)
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).send({
      success: true,
      message: "Transfers retrieved successfully",
      data: {
        requests: transfers,
        meta: {
            total: count,
            page: parseInt(page),
            perPage: parseInt(limit),
        }
      },
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).send({
      message: error.message,
    });
  }
};

const organizationLabelAudit = async (req, res) => {
  try {
    const requestlabel = await organization.findOne({
      _id: req.user.organizationLabel,
    });
    if (!requestlabel) {
      return res.status(400).send({
        success: false,
        message: "No organization with that label",
      });
    }

    // Get all accounts tied to the gc organization label
    const request_accounts = await Account.find({
      organizationLabel: requestlabel._id,
    });
    if (!request_accounts || request_accounts.length === 0) {
      return res.status(400).send({
        success: false,
        message: "No account registered with this organization yet",
      });
    }

    // Fetch all audits for each request_accounts._id with search filter and pagination
    const page = req.query.page || 1; // Current page number
    const limit = req.query.perPage || 10; // Number of audits per page
    const searchType = req.query.type || ""; // Search type

    const query = {
      organization: { $in: request_accounts.map((account) => account._id) },
    };

    if (searchType) {
      query.type = { $regex: searchType, $options: "i" };
    }

    const count = await Audit.countDocuments(query);
    const trails = await Audit.find(query)
      .skip((page - 1) * limit)
      .sort({ _id: -1 })
      .limit(limit)
      .populate("user");

    return res.status(200).send({
      success: true,
      message: "Audits retrieved successfully",
      data: {
        trails,
        meta: {
          total: count,
          page: parseInt(page),
          perPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).send({});
  }
};

async function getallOrganizationLabelAnalytics(req, res) {
  try {
    const requestLabel = await organization.findOne({
      _id: req.user.organizationLabel,
    });

    if (!requestLabel) {
      return res.status(400).send({
        success: false,
        message: "No organization with that label",
      });
    }

    const year = req.params.year;

    const getTotalCount = async () => {
      return InitiateRequest.aggregate([
        {
          $match: {
            organizationLabel: requestLabel._id,
            status: { $in: ["approved", "pending", "declined", "in progress"] },
          },
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);
    };

   const getDisbursementsPerYear = () => InitiateRequest.aggregate([
			{
				$match: {
          organizationLabel:requestLabel._id,
					transferStatus: "successful",
					$expr: {
						$and: [
							{ $gte: [{ $toInt: { $substr: ["$createdAt", 0, 4] } }, parseInt(year)] },
							{ $lte: [{ $toInt: { $substr: ["$createdAt", 0, 4] } }, parseInt(year) + 1] }
						]
					}
				},
			},
			{
				$group: {
					_id: {
						month: { $month: { $toDate: "$createdAt" } },
					},
					amount: { $sum: "$amount" },
				},
			},
			{
				$project: {
					_id: 0,
					month: {
						$switch: {
							branches: [
								{ case: { $eq: ["$_id.month", 1] }, then: "January" },
								{ case: { $eq: ["$_id.month", 2] }, then: "February" },
								{ case: { $eq: ["$_id.month", 3] }, then: "March" },
								{ case: { $eq: ["$_id.month", 4] }, then: "April" },
								{ case: { $eq: ["$_id.month", 5] }, then: "May" },
								{ case: { $eq: ["$_id.month", 6] }, then: "June" },
								{ case: { $eq: ["$_id.month", 7] }, then: "July" },
								{ case: { $eq: ["$_id.month", 8] }, then: "August" },
								{ case: { $eq: ["$_id.month", 9] }, then: "September" },
								{ case: { $eq: ["$_id.month", 10] }, then: "October" },
								{ case: { $eq: ["$_id.month", 11] }, then: "November" },
								{ case: { $eq: ["$_id.month", 12] }, then: "December" },
							],
							default: "Invalid Month",
						},
					},
					amount: 1,
				},
			},
		]);


    const getDisbursementsTotal = async () => {
      return InitiateRequest.aggregate([
        {
          $match: {
            organizationLabel: requestLabel._id,
            transferStatus: "successful",
          },
        },
        {
          $group: {
            _id: null,
            amount: { $sum: "$amount" },
          },
        },
        {
          $project: {
            _id: 0,
          },
        },
      ]);
    };

    const getPendingRequestTotal = async () => {
      return InitiateRequest.aggregate([
        {
          $match: {
            organizationLabel: requestLabel._id,
            transferStatus: "disburse pending",
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
          },
        },
      ]);
    };

    const totalApproved = async () => {
      return InitiateRequest.countDocuments({
        organizationLabel: requestLabel._id,
        status: "approved",
      });
    };

    const totalDeclined = async () => {
      return InitiateRequest.countDocuments({
        organizationLabel: requestLabel._id,
        status: "declined",
      });
    };

    const totalTransactions = async () => {
      return InitiateRequest.countDocuments({
        organizationLabel: requestLabel._id,
        transferStatus: {
          $in: ["successful"],
        },
      });
    };

    const [totalCount, disbursementsPerYear, disbursementsTotal, pendingRequestTotal, totalApprovedCount, totalDeclinedCount, totalSuccessfulTransactions] = await Promise.all([
      getTotalCount(),
      getDisbursementsPerYear(),
      getDisbursementsTotal(),
      getPendingRequestTotal(),
      totalApproved(),
      totalDeclined(),
      totalTransactions(),
    ]);

    const reportData = {
      data: {
        getTotalCount: totalCount,
        disbursements: {
          year,
          data: disbursementsPerYear,
          total: disbursementsPerYear.reduce((acc, cur) => acc + cur.amount, 0),
        },
        totalDisbursements: disbursementsTotal[0] || { amount: 0 },
        pendingRequest: pendingRequestTotal[0]?.count || 0,
        totalApproved: totalApprovedCount,
        totalDeclined: totalDeclinedCount,
        totalSuccessfulTransactions: totalSuccessfulTransactions,
      },
      status: "success",
    };

    return res.status(200).json(reportData);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
}



module.exports = {
  getAllusersTiedToGCAccount,
  getAllusersTiedToAnAccount,
  getallOrganizationLabelAnalytics,
  dashBoardAnalytics,
  transferRequest,
  organizationLabelAudit,
};
