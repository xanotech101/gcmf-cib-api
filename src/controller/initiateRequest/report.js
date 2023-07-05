const { default: mongoose } = require("mongoose");
const InitiateRequest = require("../../model/initiateRequest.model");
const User = require("../../model/user.model");
const Account = require("../../model/account");

const getReportAnalysis = async (req, res) => {
  try {
		const year = req.params.year;

    const getTotalCount = () => InitiateRequest.aggregate([
      {
        $match: {
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

    const getDisbursementsPerYear = () => InitiateRequest.aggregate([
      {
        $match: {
          transferStatus: "successful",
					createdAt: {
            $gte: new Date(year, 0, 1), // January 1st of the requested year
            $lte: new Date(year, 11, 31), // December 31st of the requested year
          },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
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

		const getDisbursementsTotal = () => InitiateRequest.aggregate([
			{
				$match: {
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
				}
			}
		]);

		const getPendingRequestTotal = () =>  InitiateRequest.aggregate([
			{
				$match: {
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

		const totalApproved = () => InitiateRequest.countDocuments({
			status: "approved",
		});

		const totalDeclined = () => InitiateRequest.countDocuments({
			status: "declined",
		});

		const totalTransactions = () => InitiateRequest.countDocuments({
			transferStatus: {
				$in: ["successful"],
			}
		});

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
    return res.status(500).json({
      message: error.message,
      status: "failed",
    });
  }
};

const getReportAnalysisForCooperateAccount = async (req, res) => {
	try {
	  const year = req.params.year;
	  const check_account = await InitiateRequest.findOne({
		organizationId: mongoose.Types.ObjectId(req.user.organizationId),
	  });
  
	  if (!check_account) {
		return res.status(400).json({
		  message: "This account does not have any initiated request",
		  status: "failed",
		});
	  }
  
	  const getDisbursements = await InitiateRequest.aggregate([
		{
		  $match: {
			organizationId: mongoose.Types.ObjectId(req.user.organizationId),
			transferStatus: "successful",
			payerAccountNumber: req.params.accountNumber,
			$expr: {
			  $and: [
				{ $gte: [{ $toInt: { $substr: ["$createdAt", 0, 4] } } , parseInt(year)] },
				{ $lte: [{ $toInt: { $substr: ["$createdAt", 0, 4] } } , parseInt(year) + 1] }
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
  
	  return res.status(200).json({
		data: {
		  disbursements: getDisbursements,
		  totalAmount: getDisbursements.reduce((acc, cur) => acc + cur.amount, 0),
		  year,
		  account: req.params.accountNumber,
		},
		status: "success",
	  });
	} catch (error) {
	  console.log(error);
	  return res.status(500).json({
		message: error.message,
		status: "failed",
	  });
	}
  };
  

const dashBoardAnalytics = async (req, res) => {
	const totalUsers = await User.countDocuments();
	const totalAccounts = await Account.countDocuments();
	const totalTransfers = await InitiateRequest.countDocuments({
		transferStatus: {
			$in: ["successful", "failed", "pending", "disburse pending"],
		}
	});

	return res.status(200).json({
		data: {
			totalAccounts,
			totalUsers,
			totalTransfers,
		},
		status: "success",
	});
};

module.exports = { getReportAnalysis, getReportAnalysisForCooperateAccount, dashBoardAnalytics };
