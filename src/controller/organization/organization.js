
const organizationmodel = require('../../model/organization');

const createOrganizationLabel = async (req, res) => {
    try {
        console.log(req.body)
        const createLabel = await organizationmodel.findOne({ label: req.body.label })
        if (createLabel) {
            return res.status(400).json({ message: 'oraganizationLabel already created' });
        }
        await organizationmodel.create({
            label: req.body.label
        })

        return res.status(200).json({ message: 'organization created successfully' });
    } catch (error) {
        console.log('organization', error)
        return res.status(500).json({ message: error.message });
    }
}

const getAllOrganizationLabel = async (req, res) => {
    try {
        const request = await organizationmodel.find()
        return res.status(200).send({
            message: 'fetched organization successfully',
            data: request
        })
    } catch (error) {
        console.log('organizations', error)
        return res.status(500).json({ message: error.message });
    }
}

module.exports = { createOrganizationLabel, getAllOrganizationLabel }