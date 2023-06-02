const { default: mongoose } = require("mongoose");
const Account = require("../model/account");
const organization = require("../model/organization");
const userModel = require("../model/user.model");
const { getMonthName } = require("./external/externalcontroller");


async function getAllusersTiedToGCAccount(req, res) {
    const page = parseInt(req.query.page) || 1; // Current page (default: 1)
    const limit = parseInt(req.query.limit) || 10; // Number of results per page (default: 10)

    try {
        // Get gc organization label
        const requestLabel = await organization.findOne({ label: 'Grooming Centre' });
        if (!requestLabel) {
            return res.status(400).send({
                success: false,
                message: 'No organization with that label'
            });
        }

        // Get all accounts tied to the gc organization label
        const requestAccounts = await Account.find({
            organizationLabel: requestLabel._id
        });

        if (!requestAccounts || requestAccounts.length === 0) {
            return res.status(400).send({
                success: false,
                message: 'No account registered with this organization yet'
            });
        }

        const accountIds = requestAccounts.map(account => account._id);

        // Create a filter object based on search criteria
        const searchName = req.query.name; // Name to search (firstName or lastName)
        const filter = {};
        if (searchName) {
            filter.$or = [
                { firstName: { $regex: searchName, $options: 'i' } },
                { lastName: { $regex: searchName, $options: 'i' } }
            ];
        }

        // Count total documents based on the filter
        const totalCount = await userModel.countDocuments({
            organizationId: { $in: accountIds },
            ...filter
        });

        // Calculate total pages
        const totalPages = Math.ceil(totalCount / limit);

        // Search for users based on organizationId and name filter, with pagination
        const requestUsers = await userModel
            .find({
                organizationId: { $in: accountIds },
                ...filter
            })
            .skip((page - 1) * limit)
            .limit(limit);

        return res.status(200).send({
            success: true,
            message: 'Users fetched successfully',
            data: requestUsers,
            totalPages,
            totalDocuments: totalCount,
            currentPage: page
        });
    } catch (error) {
        return res.status(500).send({
            success: false,
            message: 'Internal server error'
        });
    }
}


async function getAllusersTiedToAnAccount(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 10; // Set the desired number of users per page
  
      const searchName = req.query.name; // Name to search (firstName or lastName)
      const filter = {};
      if (searchName) {
        filter.$or = [
          { firstName: { $regex: searchName, $options: 'i' } }, // Case-insensitive regex matching firstName
          { lastName: { $regex: searchName, $options: 'i' } } // Case-insensitive regex matching lastName
        ];
      }
  
      const totalCount = await userModel.countDocuments({
        organizationId: req.params.account,
        ...filter
      });
  
      const totalPages = Math.ceil(totalCount / limit);
  
      const skip = (page - 1) * limit;
  
      const users = await userModel
        .find({
          organizationId: req.params.account,
          ...filter
        })
        .skip(skip)
        .limit(limit);
  
      return res.status(200).json({
        success: true,
        message: 'Users tied to this account',
        data: users,
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

const getAllAccountsByGCLabel = async (req, res) => {
    try {
      const PAGE_SIZE = parseInt(req.query.perPage) || 10; // Number of accounts per page
  
      const page = parseInt(req.query.page) || 1;
      const skip = (page - 1) * PAGE_SIZE;
  
      const organizationLabel = await organization.findOne({ label: 'Grooming Centre' });
      if (!organizationLabel) {
        return res.status(400).send({
          success: false,
          message: 'No GC organization found',
        });
      }

      // Count total number of accounts based on organizationLabel
      const totalAccounts = await Account.countDocuments({ organizationLabel: organizationLabel._id });
  
      // Find accounts based on organizationLabel with pagination and population of admin and organizationLabel fields
      const accounts = await Account.find({ organizationLabel: organizationLabel._id })
        .skip(skip)
        .limit(PAGE_SIZE)
        .sort({ _id: -1 })
        .populate("adminID")
        .populate("organizationLabel");
  
      // Return the accounts along with additional information
      return res.status(200).json({
        success: true,
        message: 'Accounts fetched successfully',
        accounts,
        totalAccounts,
        currentPage: page,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: error.message,
      });
    }
  };
  
  
module.exports = { getAllusersTiedToGCAccount, getAllusersTiedToAnAccount, getGcAnalytics,getAllAccountsByGCLabel }