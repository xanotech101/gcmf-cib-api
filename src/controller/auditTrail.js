const AuditTrail = require("../model/auditTrail");
const { PER_PAGE } = require("../utils/constants");
const User = require("../model/user.model");
const { default: mongoose } = require("mongoose");

const getAllAuditTrail = async (req, res) => {
  const { page, perPage, type } = req.query;

  const options = {
    page: parseInt(page) || 1,
    limit: parseInt(perPage) || PER_PAGE,
    sort: { _id: -1 },
  };

  const filter = {};

  if (type) {
    filter.type = { $regex: type, $options: "i" }; // Case-insensitive regex matching the type field
  }

  try {
    const totalTrails = await AuditTrail.countDocuments(filter);

    const trails = await AuditTrail.find(filter)
      .sort(options.sort)
      .skip(options.limit * (options.page - 1))
      .limit(options.limit)
      .populate("user");

    res.status(200).json({
      message: "Audit trail fetched successfully",
      data: {
        trails,
        meta: {
          total: totalTrails,
          page: options.page,
          perPage: options.limit,
        },
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};


const getOrganizationAuditTrail = async (req, res) => {
  const { page, perPage, type } = req.query;

  const options = {
    page: parseInt(page) || 1,
    limit: parseInt(perPage) || PER_PAGE,
    sort: { _id: -1 },
  };

  try {
    const mine = await User.findById(req.user._id);
    const organizationId = mine.organizationId.toString();

    const filter = { organization: organizationId };

    if (type) {
      filter.type = { $regex: type, $options: "i" }; // Case-insensitive regex matching the type field
    }

    const totalTrails = await AuditTrail.countDocuments(filter);

    const trails = await AuditTrail.find(filter)
      .sort(options.sort)
      .skip(options.limit * (options.page - 1))
      .limit(options.limit)
      .populate({
        path: "user",
        select: "_id firstName lastName",
      });

    res.status(200).json({
      message: "Audit trail fetched successfully",
      data: {
        trails,
        meta: {
          total: totalTrails,
          page: options.page,
          perPage: options.limit,
        },
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};


const getAuditTrailForSingleUser = async (req, res) => {
  const { page, perPage, type } = req.query;
  const { userId } = req.params;

  const options = {
    page: parseInt(page) || 1,
    limit: parseInt(perPage) || PER_PAGE,
    sort: { _id: -1 },
  };

  try {
    const filter = { user: mongoose.Types.ObjectId(userId) };

    if (type) {
      filter.type = { $regex: type, $options: "i" }; // Case-insensitive regex matching the type field
    }

    const totalTrails = await AuditTrail.countDocuments(filter);

    const trails = await AuditTrail.find(filter)
      .sort(options.sort)
      .skip(options.limit * (options.page - 1))
      .limit(options.limit)
      .populate({
        path: "user",
        select: "_id firstName lastName",
      });

    res.status(200).json({
      message: "User audit trail fetched successfully",
      data: {
        trails,
        meta: {
          total: totalTrails,
          page: options.page,
          perPage: options.limit,
        },
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};


module.exports = {
  getAllAuditTrail,
  getOrganizationAuditTrail,
  getAuditTrailForSingleUser
};
