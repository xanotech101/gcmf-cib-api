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
            $match: {
              "status": {
                $nin: ["active"],
              },
            },
          },

          {
            $lookup: {
              from: "users",
              localField: "authorizers",
              foreignField: "_id",
              as: "authorizers",
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "verifier",
              foreignField: "_id",
              as: "verifier",
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
    


const getAllNotifiactionForAuthoriser = async (req, res) => {
  try {
    const { perPage, page } = req.query;

    const options = {
      page: page || 1,
      limit: perPage || PER_PAGE,
      sort: { createdAt: -1 },
    };

    const notifications = await Notification.aggregate([
      {
        $match: {
          status: {
            $in: ["active", "verified", "rejected"],
          },
        },
      },

      {
        $lookup: {
          from: "users",
          localField: "authorizers",
          foreignField: "_id",
          as: "authorizers",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "verifier",
          foreignField: "_id",
          as: "verifier",
        },
      },
      //   {
      //     $unwind: "$authorizer",
      //   },

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
    



const getAllNotifiactionForVerifier = async (req, res) => {
  try {
    const { perPage, page } = req.query;

    const options = {
      page: page || 1,
      limit: perPage || PER_PAGE,
      sort: { createdAt: -1 },
    };

    const notifications = await Notification.aggregate([
      {
        $match: {
          status: {
            $in: ["authorized"],
          },
        },
      },

      {
        $lookup: {
          from: "users",
          localField: "authorizers",
          foreignField: "_id",
          as: "authorizers",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "verifier",
          foreignField: "_id",
          as: "verifier",
        },
      },
      //   {
      //     $unwind: "$authorizer",
      //   },

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
  getAllNotifiactionForInitiator,
  getAllNotifiactionForAuthoriser,
  getAllNotifiactionForVerifier,
};
