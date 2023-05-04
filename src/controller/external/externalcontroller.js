const jwt = require("jsonwebtoken");
const thirdPartyModel = require("../../model/user.model");
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
            organization_name: req.body.organization_name
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

module.exports = { generateUserToken }