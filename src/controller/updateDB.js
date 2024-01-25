const AuditTrail = require("../model/auditTrail");
const Account = require("../model/account")
const Ticket = require('../model/ticket.model');
const mandateModel = require("../model/mandate.model");
const userModel = require("../model/user.model");

async function updateAuditTrail() {
    try {
        // Get all accounts with organization labels
        const accountsWithOrganizationLabels = await Account.find({
            organizationLabel: { $exists: true }
        });

        // Iterate through all audits
        const allAudits = await AuditTrail.find();
        for (const audit of allAudits) {
            // Check if the audit's organization is associated with an account with an organization label
            const matchingAccount = accountsWithOrganizationLabels.find((account) => account._id.equals(audit.organization));

            if (matchingAccount) {
                // Handle empty strings and valid ObjectIds
                if (!audit.organizationLabel) {
                    // Assign the organization label if it's empty
                    audit.organizationLabel = matchingAccount.organizationLabel || '';
                    await audit.save();
                    console.log('saved');
                } else if (audit.organizationLabel !== '') {
                    // Audit already has an organization label, skip updating
                    console.log('Audit already has an organization label');
                }
            } else {
                // No matching account found
                console.log('No matching account found for audit');
            }
        }
    } catch (error) {
        console.log(error)
    }
}

async function updateTicketTrail() {
    try {
        // Get all accounts with organization labels
        const accountsWithOrganizationLabels = await Account.find({
            organizationLabel: { $exists: true }
        });

        // Iterate through all ticket
        const allTicket = await Ticket.find();
        for (const ticket of allTicket) {
            // Check if the ticket's organization is associated with an account with an organization label
            const matchingAccount = accountsWithOrganizationLabels.find((account) => account._id.equals(ticket.organization));

            if (matchingAccount) {
                // Handle empty strings and valid ObjectIds
                if (!ticket.organizationLabel) {
                    // Assign the organization label if it's empty
                    ticket.organizationLabel = matchingAccount.organizationLabel || '';
                    await ticket.save();
                    console.log('saved');
                } else if (ticket.organizationLabel !== '') {
                    // ticket already has an organization label, skip updating
                    console.log('ticket already has an organization label');
                }
            } else {
                // No matching account found
                console.log('No matching account found for ticket');
            }
        }
    } catch (error) {
        console.log(error)
    }
}

async function updateMandate() {
    try {
        // Get all accounts with organization labels
        const accountsWithOrganizationLabels = await Account.find({
            organizationLabel: { $exists: true }
        });

        // Iterate through all madate
        const allMandate = await mandateModel.find();
        for (const mandate of allMandate) {
            // Check if the mandate's organization is associated with an account with an organization label
            const matchingAccount = accountsWithOrganizationLabels.find((account) => account._id.equals(mandate.organizationId));

            if (matchingAccount) {
                // Handle empty strings and valid ObjectIds
                if (!mandate.organizationLabel) {
                    // Assign the organization label if it's empty
                    mandate.organizationLabel = matchingAccount.organizationLabel || '';
                    await mandate.save();
                    console.log('saved');
                } else if (mandate.organizationLabel !== '') {
                    // mandate already has an organization label, skip updating
                    console.log('mandate already has an organization label');
                }
            } else {
                // No matching account found
                console.log('No matching account found for mandate');
            }
        }
    } catch (error) {
        console.log(error)
    }
}

async function updateUser() {
    try {
        // Get all accounts with organization labels
        const accountsWithOrganizationLabels = await Account.find({
            organizationLabel: { $exists: true }
        });

        // Iterate through all users
        const allUsers = await userModel.find();
        for (const user of allUsers) {
            // Check if the user's organization is associated with an account with an organization label
            const matchingAccount = accountsWithOrganizationLabels.find((account) => account._id.equals(user.organizationId));

            if (matchingAccount) {
                // Handle empty strings and valid ObjectIds
                if (!user.organizationLabel) {
                    // Assign the organization label if it's empty
                    user.organizationLabel = matchingAccount.organizationLabel || '';
                    await user.save();
                    console.log('saved');
                } else if (user.organizationLabel !== '') {
                    // user already has an organization label, skip updating
                    console.log('user already has an organization label');
                }
            } else {
                // No matching account found
                console.log('No matching account found for user');
            }
        }
    } catch (error) {
        console.log(error)
    }
}
module.exports = { updateAuditTrail, updateTicketTrail, updateMandate, updateUser }