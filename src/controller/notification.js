const Notification = require("../model/notification");
const { PER_PAGE } = require("../utils/constants");
const mongoose = require("mongoose");


const getAllNotifiactions= async (req, res) => {
  try {
      
    const id = req.params.id;
    console.log(id)
        const { perPage, page } = req.query;
    
        const options = {
        page: page || 1,
        limit: perPage || PER_PAGE,
        sort: { createdAt: -1 },
        };
    
        
        const notifications = await Notification.aggregate([
          {
            $match: {
              userID: mongoose.Types.ObjectId(id),
            },
          },

          {
            $lookup: {
              from: "users",
              localField: "userID",
              foreignField: "_id",
              as: "user",
            },
          },
          {
            $lookup: {
              from: "initiaterequests",
              localField: "transaction",
              foreignField: "_id",
              as: "transaction",
            },
          },
          // {
          //   $unwind: "$verifier",
          // },

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
    
       return res.status(200).json({
         message: "Successfully fetched notifications",
         notifications: notifications,
       });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message });
    }
};
    


module.exports = {
  getAllNotifiactions,
}
