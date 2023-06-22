const { default: mongoose } = require("mongoose");
const Account = require("../model/account");
const organization = require("../model/organization");
const userModel = require("../model/user.model");
const Audit = require("../model/auditTrail")

const { getMonthName } = require("./external/externalcontroller");

async function getAllusersTiedToGCAccount(req, res) {
    try {

        //get gc organizationlabel
        const requestlabel = await organization.findOne({ label: 'Grooming Centre' })
        if (!requestlabel) {
            return res.status(400).send({
                success: false,
                message: 'no organization with that label'
            })
        }
        //get all accounts tied to the gc organization lable
        const request_accounts = await Account.find({
            organizationLabel: requestlabel._id
        })
        if (!request_accounts || request_accounts.length === 0) {
            return res.status(400).send({
                success: false,
                message: 'No account registered with this organization yet',
            });
        }

        const request_users = [];
        for (const account of request_accounts) {
            const users = await userModel.find({ organizationId: account._id }).populate('privileges');
            request_users.push(...users);
        }

        return res.status(200).send({
            success: false,
            message: 'users fetched successufully',
            data: {
                users: request_users
            }
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

        const totalCount = await userModel.countDocuments({ organizationId: req.params.account });

        const totalPages = Math.ceil(totalCount / limit);

        const skip = (page - 1) * limit;

        const users = await userModel
            .find({ organizationId: req.params.account })
            .skip(skip)
            .limit(limit);

        return res.status(200).json({
            success: true,
            message: 'Users tied to this account',
            data: {
                users,
            },
            currentPage: page,
            totalPages: totalPages
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message });
    }
}

async function getGcAnalytics(req, res) {
    try {
        const requestlabel = await organization.findOne({ label: 'Grooming Centre' });
        if (!requestlabel) {
            return res.status(400).send({
                success: false,
                message: 'No organization with that label'
            });
        }

        const requestedYear = req.query.date;
        const requestedRequestType = req.query.requesttype;

        const analytics = await Account.aggregate([
            {
                $match: {
                    organizationLabel: mongoose.Types.ObjectId(requestlabel._id),
                    createdAt: { $regex: new RegExp(requestedYear), $options: "i" },
                    requestType: requestedRequestType
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: { $dateFromString: { dateString: "$createdAt" } } },
                        month: { $month: { $dateFromString: { dateString: "$createdAt" } } }
                    },
                    numberOfRequests: { $sum: 1 },
                    accounts: { $push: "$$ROOT" } // Add this $push aggregation to include the accounts
                }
            }
        ]);

        const formattedAnalytics = analytics.map((item) => ({
            year: item._id.year,
            month: getMonthName(item._id.month),
            numberOfRequests: item.numberOfRequests,
            accounts: item.accounts
        }));

        res.json({
            success: true,
            analytics: formattedAnalytics
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message });
    }
}

const dashBoardAnalytics = async (req, res) => {
    //Get all gc accounts
    const requestlabel = await organization.findOne({ label: 'Grooming Centre' })
    if (!requestlabel) {
        return res.status(400).send({
            success: false,
            message: 'no organization with that label'
        })
    }
    //get all accounts tied to the gc organization lable
    const totalAccounts = await Account.countDocuments({
        organizationLabel: requestlabel._id
    })


    // get all users tied to gc accounts
    //get all accounts tied to the gc organization lable
    const request_accounts = await Account.find({
        organizationLabel: requestlabel._id
    })

    const AllUsers = [];
    if (request_accounts.length > 0) {
        for (const account of request_accounts) {
            const users = await userModel.find({ organizationId: account._id });
            AllUsers.push(...users);
        }
    }
    const totatlUsers = AllUsers.length

    return res.status(200).json({
        data: {
            totalAccounts,
            totatlUsers
        },
        status: "success",
    });
};

const gcAudit = async (req, res) => {
    try {
        const requestlabel = await organization.findOne({ label: 'Grooming Centre' })
        if (!requestlabel) {
            return res.status(400).send({
                success: false,
                message: 'No organization with that label'
            });
        }

        // Get all accounts tied to the gc organization label
        const request_accounts = await Account.find({
            organizationLabel: requestlabel._id
        });
        if (!request_accounts || request_accounts.length === 0) {
            return res.status(400).send({
                success: false,
                message: 'No account registered with this organization yet',
            });
        }

        // Fetch all audits for each request_accounts._id with search filter and pagination
        const page = req.query.page || 1; // Current page number
        const limit = req.query.limit || 10; // Number of audits per page
        const searchType = req.query.type || ''; // Search type

        const query = {
            organization: { $in: request_accounts.map(account => account._id) },
        };

        if (searchType) {
            query.type = { $regex: searchType, $options: 'i' };
        }

        const count = await Audit.countDocuments(query);
        const audits = await Audit.find(query)
            .skip((page - 1) * limit)
            .limit(limit);

        return res.status(200).send({
            success: true,
            message: 'Audits retrieved successfully',
            data: {
                audits,
                total: count,
                page: parseInt(page),
                totalPages: Math.ceil(count / limit),
            },
        });

    } catch (error) {
        console.log(error.message);
        return res.status(500).send({
            message: error.message,
        });
    }
};


module.exports = { getAllusersTiedToGCAccount, getAllusersTiedToAnAccount, getGcAnalytics, dashBoardAnalytics,gcAudit }