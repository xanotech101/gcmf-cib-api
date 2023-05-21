const Account = require("../model/account");
const organization = require("../model/organization");
const userModel = require("../model/user.model");

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
            const users = await userModel.find({ organizationId: account._id });
            request_users.push(...users);
        }

        return res.status(200).send({
            success: false,
            message: 'users fetched successufully',
            data: request_users
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
            data: users,
            currentPage: page,
            totalPages: totalPages
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message });
    }
}
module.exports = { getAllusersTiedToGCAccount, getAllusersTiedToAnAccount }