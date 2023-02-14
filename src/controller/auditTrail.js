const AuditTrail = require("../model/auditTrail");
const { PER_PAGE } = require("../utils/constants");

const getAllAuditTrail = async (req, res) => {
  const { page, perPage } = req.query;

  const options = {
    page: page || 1,
    limit: perPage || PER_PAGE,
    sort: { createdAt: -1 },
  };

  try {
    const result = await AuditTrail.aggregate([
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
      message: "Audit trail fetcehd successfully", 
      data: {
        trails: result[0].data,
        meta: result[0].meta[0]
      } 
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

const getOrganizationAuditTrail = async (req, res) => {
  const { page, perPage } = req.query;

  const options = {
    page: page || 1,
    limit: perPage || PER_PAGE,
    sort: { createdAt: -1 },
  };

  try {
    const result = await AuditTrail.aggregate([
      {
        $match: { organization: req.user.organization }
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
      message: "Audit trail fetched successfully", 
      data: {
        trails: result[0].data,
        meta: result[0].meta[0]
      } 
    });
  }catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}


module.exports = {
  getAllAuditTrail,
  getOrganizationAuditTrail
};
