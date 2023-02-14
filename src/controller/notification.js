const Notification = require("../model/notification");
const { PER_PAGE } = require("../utils/constants");


const getAllNotifiactionForInitiator = async (req, res) => {
    try {
        const { perPage, page } = req.query;
    
        const options = {
        page: page || 1,
        limit: perPage || PER_PAGE,
        sort: { createdAt: -1 },
        };
    
        const notifications = await Notification.aggregate([
          {
            $lookup: {
              from: "users",
              localField: "authorizers",
              foreignField: "_id",
              as: "authorizers",
            },
          },
          {
            $unwind: "$authorizer",
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
        message: "Successfully fetched notifications",
        data: notifications,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};
    



module.exports = {
  getAllNotifiactionForInitiator,
};
