const Ticket = require("../../model/ticket.model");
const { PER_PAGE } = require("../../utils/constants");
const mongoose = require("mongoose");

const getAllTickets = async (req, res) => {
  const { perPage, page } = req.query;
  const options = {
    page: page || 1,
    limit: perPage || PER_PAGE,
    sort: { createdAt: -1 },
  };

  try {
    const tickets = await Ticket.aggregate([
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
        $lookup: {
          from: "accounts",
          localField: "organization",
          foreignField: "_id",
          as: "organization",
        },
      },
      {
        $unwind: "$organization",
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
      message: "Successfully fetched admin requests",
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
    await Ticket.create({
      createdBy: mongoose.Types.ObjectId(req.user._id),
      topic: req.body.topic,
      message: req.body.message,
      meta: req.body.meta,
      organization: mongoose.Types.ObjectId(req.user.organizationId),
    });

    res.status(200).json({
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
    if(!ticket) {
      return res.status(404).json({
        message: "Ticket not found",
        status: "failed",
      });
    }

    ticket.response.push({
      responseBy: mongoose.Types.ObjectId(req.user._id),
      response: req.body.response,
    });

    await ticket.save();

    res.status(200).json({
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
