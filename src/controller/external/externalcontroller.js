const jwt = require("jsonwebtoken");
const thirdPartyModel = require("../../model/thirdParty.model");
const organization = require("../../model/organization");
async function generateUserToken(req, res) {
    try {


        if (!req.body.organization_name) {
            return res.status(400).send({
                success: false,
                message: 'please your organization name is required'
            })
        }
        //check if organization name already registered
        const requestname = await thirdPartyModel.findOne({ organization_name: req.body.organization_name })
        if (requestname) {
            const genrateToken = jwt.sign(
                { organization_name: req.body.organization_name },
                process.env.JWT_SECRET,
                {
                    expiresIn: "15d",
                }
            );

            return res.status(200).send({
                success: true,
                message: 'this organization now have access',
                data: genrateToken

            })
        }

        const genrateToken = jwt.sign(
            { organization_name: req.body.organization_name },
            process.env.JWT_SECRET,
            {
                expiresIn: "15d",
            }
        );

        await thirdPartyModel.create({
            organization_name: req.body.organization_name,
        })

        return res.status(200).send({
            success: true,
            message: 'this organization now have access',
            data: genrateToken

        })
    } catch (error) {
        console.log(error)
        res.status(500).send({
            success: false,
            message: error.message
        })
    }
}

async function getAllThirdPartyOrganizations(req, res) {
    try {
        const page = req.query.page || 1; // Current page, default to page 1 if not provided
        const numPerPage = req.query.numPerPage || 10; // Number of results per page, default to 10 if not provided

        let skipNum = 0;
        if (page > 1) {
            skipNum = (page - 1) * numPerPage; // Number of documents to skip
        }

        let totalCount = 0;
        let totalPages = 0;
        let results = [];

        if (numPerPage && numPerPage !== '0') {
            // If numPerPage is defined and not 0, paginate the results
            totalCount = await thirdPartyModel.countDocuments();
            totalPages = Math.ceil(totalCount / numPerPage);
            results = await thirdPartyModel.find().skip(skipNum).limit(numPerPage);
        } else {
            // If numPerPage is not defined or 0, return all the data
            results = await thirdPartyModel.find();
            totalCount = results.length;
            totalPages = 1;
        }

        if (results.length === 0 && page !== 1) {
            // If there are no results on a page other than the first page, return an error
            res.status(404).json({ message: 'Page not found' });
        } else {
            // If there are results, return them along with pagination info
            res.json({
                page,
                totalPages,
                totalCount,
                results
            });
        }

    } catch (error) {
        console.log(error.message)
        res.status(500).send({
            success: false,
            message: error.message
        })
    }
}

module.exports = { generateUserToken, getAllThirdPartyOrganizations }