const { default: mongoose } = require("mongoose");
const InitiateRequest = require("../../model/initiateRequest.model");
const getReportAnalysis = async (req, res) => {
  try {
    //get count for all approve request
    const getTotalCount = await InitiateRequest.aggregate([
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

    const getAllAprove = await InitiateRequest.aggregate([
      {
        $match: {
          status: "approved",
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          amounts: { $push: "$amount" },
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
          year: "$_id.year",
          amounts: 1,
        },
      },
    ]);

    if (!(getTotalCount && getAllAprove)) {
      return res.status(500).json({
        message: "error getting total document counts",
        status: "failed",
      });
    }
    return res.status(200).json({
      message: { getTotalCount, getAllAprove },
      status: "success",
    });
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

    return res.status(200).json({
      data: {
        disbursements: getDisbursements,
				totalAmount: getDisbursements.reduce((acc, cur) => acc + cur.amount, 0),
				year,
				account: req.params.accountNumber
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

module.exports = { getReportAnalysis, getReportAnalysisForCooperateAccount };
