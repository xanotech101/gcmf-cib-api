const Ticket = require("../../model/ticket.model");
const { PER_PAGE } = require("../../utils/constants");
const mongoose = require("mongoose");
const userModel = require("../../model/user.model");
const { sendEmail } = require("../../utils/emailService");
const { insertMany } = require("../../model/account");

const getAllTickets = async (req, res) => {
  const { perPage, page } = req.query;
  const options = {
    page: page || 1,
    limit: perPage || PER_PAGE,
    sort: { createdAt: -1 },
  };

  try {
    const tickets = await Ticket.find()
      .populate({
        path: 'createdBy',
        model: 'User',
      })
      .populate({
        path: 'organization',
        model: 'Account',
      })
      .skip(options.limit * (options.page - 1))
      .limit(options.limit)
      .sort(options.sort);

    if (tickets.length === 0) {
      console.log("No tickets found");
      return res.status(404).json({
        message: "No tickets found",
        status: "error",
      });
    }

    console.log("Tickets:", tickets);

    res.status(200).json({
      message: "Successfully fetched admin requests",
      data: {
        tickets,
        meta: {
          total: tickets.length,
          page: options.page,
          perPage: options.limit,
        },
      },
      status: "success",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      status: "failed",
    });
  }
};

const getMyOrganizationTickets = async (req, res) => {
  const { perPage, page } = req.query;

  const options = {
    page: page || 1,
    limit: perPage || PER_PAGE,
    sort: { createdAt: -1 },
  };

  try {
    const tickets = await Ticket.aggregate([
      {
        $match: {
          organization: mongoose.Types.ObjectId(req.user.organizationId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdBy",
        },
      },
      {
        $unwind: "$createdBy",
      },
      {
        $facet: {
          data: [
            {
              $sort: { ...options.sort },
            },
            {
              $skip: options.limit * (options.page - 1),
            },
            {
              $limit: options.limit * 1,
            },
          ],
          meta: [
            {
              $count: "total",
            },
            {
              $addFields: {
                page: options.page,
                perPage: options.limit,
              },
            },
          ],
        },
      },
    ]);

    res.status(200).json({
      message: "Successfully fetched your requests",
      data: {
        tickets: tickets[0].data,
        meta: tickets[0].meta[0],
      },
      status: "success",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      status: "failed",
    });
  }
};

const getMyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.findById(req.user._id);
    res.status(200).json({
      message: "Successfully fetched your requests",
      data: { tickets },
      status: "success",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error.message,
      status: "failed",
    });
  }
};

const createTicket = async (req, res) => {
  try {
    const checkForUserRole = await userModel.findOne({ _id: req.user._id })
    if (!checkForUserRole) {
      return res.status(404).json({
        message: "user not found",
        status: "failed",
      });
    }

    await Ticket.create({
      createdBy: mongoose.Types.ObjectId(req.user._id),
      topic: req.body.topic,
      message: req.body.message,
      meta: req.body.meta,
      organization: mongoose.Types.ObjectId(req.user.organizationId),
    });


    if (checkForUserRole.role !== 'super-admin') {
      const requestSystemAdmin = await userModel.find({ role: 'system-admin' })

      if (requestSystemAdmin.length < 1) {
        return res.status(200).json({
          message: "request created sucessfully no system admin available for backoffice",
          status: "success",
        });
      }


      requestSystemAdmin.map((admin) => {

        const subject = 'new ticket'
        const message = {
          firstName: checkForUserRole.firstName,
          message: `A ticket has been created by ${checkForUserRole.firstName} and currently waiting your response.`,
          year: new Date().getFullYear()
        }
        sendEmail(admin.email, subject, 'ticket', message)
      })
    }

    return res.status(200).json({
      message: "Your request has been logged Successfully",
      status: "success",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error.message,
      status: "failed",
    });
  }
};

const replyTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found",
        status: "failed",
      });
    }

    //if the user responding to a ticket is a system-admin then receive the organization id from payload 
    // send an email to all users belonging that organization 

    //else get the organization from the req.user. //send mail the mail to all the system-admin.

    ticket.response.push({
      responseBy: mongoose.Types.ObjectId(req.user._id),
      response: req.body.response,
    });

    const checkForUserRole = await userModel.findOne({ _id: req.user._id })
    if (!checkForUserRole) {
      return res.status(400).json({
        message: "not a valid user",
        data: {},
        status: "failed",
      });
    }

    if (checkForUserRole.role === 'system-admin') {
      //send mail to all users with this organizationId when a system-admin response
      const request_users = await userModel.find({ organizationId: ticket.organization })
      if (!request_users) {
        return res.status(400).json({
          message: "no user for this organization",
          data: {},
          status: "failed",
        });
      }
      await ticket.save();
      request_users.map((user) => {

        const subject = 'ticket response'
        const message = {
          firstName: user.firstName,
          message: `Hello ${user.firstName} a response has been made to a ticket for your organization.`,
          year: new Date().getFullYear()
        }
        sendEmail(user.email, subject, 'ticket', message)
      })

      return res.status(200).json({
        message: "Successfully responded to admin request",
        data: {},
        status: "success",
      });
    }

    await ticket.save();
    const requestSystemAdmin = await userModel.find({ role: 'system-admin' })

    if (requestSystemAdmin.length < 1) {
      return res.status(200).json({
        message: "response sucessfully no system admin available for backoffice",
        status: "success",
      });
    }


    requestSystemAdmin.map((admin) => {
      const subject = 'ticket response'

      const message = {
        firstName: checkForUserRole.firstName,
        message: `A response to a ticket has been made by ${checkForUserRole.firstName} and currently waiting your review.`,
        year: new Date().getFullYear()
      }
      sendEmail(admin.email, subject, 'ticket', message)
    })
    return res.status(200).json({
      message: "Successfully responded to admin request",
      data: {},
      status: "success",
    });



  } catch (error) {
    res.status(500).json({
      message: error.message,
      status: "failed",
    });
  }
};

const getSingleTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id).populate([
      {
        path: "createdBy",
        select: "firstName lastName email",
      },
      {
        path: "organization",
        select: "accountName",
      },
      {
        path: "response.responseBy",
        select: "firstName lastName email",
      }
    ]);
    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found",
        status: "failed",
      });
    }

    res.status(200).json({
      message: "Successfully fetched your requests",
      data: { ticket },
      status: "success",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      status: "failed",
    });
  }
};

module.exports = {
  getAllTickets,
  getMyOrganizationTickets,
  getMyTickets,
  createTicket,
  replyTicket,
  getSingleTicket,
};
