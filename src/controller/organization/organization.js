
const organizationmodel = require('../../model/organization');

const createOrganizationLabel = async (req, res) => {
    try {
        console.log(req.body)
        const createLabel = await organizationmodel.findOne({ label: req.body.label })
        if (createLabel) {
            return res.status(400).json({ message: 'oraganizationLabel already created' });
        }
        await organizationmodel.create({
            label: req.body.label,
            code: getInitials(req.body.label)
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

function getInitials(name) {
    let initials = '';
    const words = name.split(' ');

    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        if (word.length > 0) {
            initials += word[0];
        }
    }

    return initials.substring(0, 2);
}

module.exports = { createOrganizationLabel, getAllOrganizationLabel }