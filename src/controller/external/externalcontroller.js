const jwt = require("jsonwebtoken");
const thirdPartyModel = require("../../model/thirdParty.model");
const organization = require("../../model/organization");
const thirdPartyRequestCOuntModel = require("../../model/thirdpartyCount.model");
const { default: mongoose } = require("mongoose");
async function generateUserToken(req, res) {
    try {


        if (!req.body.organization_name) {
            return res.status(400).send({
                success: false,
                message: 'please your organization name is required'
            })
        }
        //check if organization name already registered
        const requestname = await thirdPartyModel.findOne({ organization_name: req.body.organization_name })
        if (requestname) {
            const genrateToken = jwt.sign(
                { organization_name: req.body.organization_name },
                process.env.JWT_SECRET,
                {
                    expiresIn: "15d",
                }
            );

            return res.status(200).send({
                success: true,
                message: 'this organization now have access',
                data: genrateToken

            })
        }

        const genrateToken = jwt.sign(
            { organization_name: req.body.organization_name },
            process.env.JWT_SECRET,
            {
                expiresIn: "15d",
            }
        );

        await thirdPartyModel.create({
            organization_name: req.body.organization_name,
            requestCount: [],
            bvnCount: []
        })


        return res.status(200).send({
            success: true,
            message: 'this organization now have access',
            data: genrateToken

        })
    } catch (error) {
        console.log(error)
        res.status(500).send({
            success: false,
            message: error.message
        })
    }
}

async function getAllThirdPartyOrganizations(req, res) {
    try {
      const page = req.query.page || 1;
      const numPerPage = req.query.numPerPage || 10;
      const searchQuery = req.query.search;
  
      let skipNum = 0;
      if (page > 1) {
        skipNum = (page - 1) * numPerPage;
      }
  
      let totalCount = 0;
      let totalPages = 0;
      let results = [];
  
      const query = searchQuery
        ? { organization_name: { $regex: searchQuery, $options: 'i' } }
        : {};
  
      if (numPerPage && numPerPage !== '0') {
        // If numPerPage is defined and not 0, paginate the results
        totalCount = await thirdPartyModel.countDocuments(query);
        totalPages = Math.ceil(totalCount / numPerPage);
        results = await thirdPartyModel
          .find(query)
          .skip(skipNum)
          .limit(numPerPage)
          .lean(); 
  
        // Fetch count for each user from thirdPartyRequestCOuntModel
        for (const result of results) {
          const { _id } = result;
  
          // Fetch count for Bvn
          const bvnCount = await thirdPartyRequestCOuntModel
            .countDocuments({ userid:_id, requestType: 'Bvn' })
            .lean();
  
          // Fetch count for NameEnquiry
          const nameEnquiryCount = await thirdPartyRequestCOuntModel
            .countDocuments({ userid:_id, requestType: 'NameEnquiry' })
            .lean();
  
          result.BvnCount = bvnCount; // Add Bvn count to the result object
          result.NameEnquiryCount = nameEnquiryCount; // Add NameEnquiry count to the result object
        }
      } else {
        // If numPerPage is not defined or 0, return all the data
        results = await thirdPartyModel.find(query).lean(); 
        totalCount = results.length;
        totalPages = 1;
      }
  
      if (results.length === 0 && page !== 1) {
        // If there are no results on a page other than the first page, return an error
        res.status(404).json({ message: 'Page not found' });
      } else {
        // If there are results, return them along with pagination info
        res.json({
          page,
          totalPages,
          totalCount,
          results,
        });
      }
    } catch (error) {
      console.log(error.message);
      res.status(500).send({
        success: false,
        message: error.message,
      });
    }
  }
  
  

async function getthirdpartyAnalytics(req, res) {
    try {
        const userId = req.params.userid; // Assuming you get the user ID from req.params.userid
        const requestedYear = req.query.date; // Assuming you get the requested year from req.query.date
        const requestedRequestType = req.query.requesttype; // Assuming you get the requested request type from req.query.requesttype
        const requestedMonth = req.query.month

        const matchStage = {
          userid: mongoose.Types.ObjectId(userId),
          requestType: requestedRequestType
      };
      
      if (requestedYear) {
          let regexMonth = '';
          
          if (requestedMonth) {
              const monthNum = new Date(`${requestedMonth} 1, 2000`).getMonth() + 1;
              regexMonth = monthNum < 10 ? '0' + monthNum.toString() : monthNum.toString();
          }
      
          matchStage.createdAt = { $regex: new RegExp(requestedYear + (regexMonth ? "-" + regexMonth : '')), $options: "i" };
      }
      
      const analytics = await thirdPartyRequestCOuntModel.aggregate([
          {
              $match: matchStage
          },
          {
              $group: {
                  _id: {
                      year: { $year: { $dateFromString: { dateString: "$createdAt" } } },
                      month: { $month: { $dateFromString: { dateString: "$createdAt" } } }
                  },
                  numberOfRequests: { $sum: 1 }
              }
          }
      ]);
      

        const formattedAnalytics = analytics.map((item) => ({
            year: item._id.year,
            month: getMonthName(item._id.month),
            numberOfRequests: item.numberOfRequests
        }));

        res.json({
            success: true,
            analytics: formattedAnalytics
        });
    } catch (error) {
        console.log(error.message)
        res.status(500).send({
            success: false,
            message: error.message
        })
    }
}


function getMonthName(month) {
    const monthNames = [
        "January", "February", "March", "April",
        "May", "June", "July", "August",
        "September", "October", "November", "December"
    ];

    return monthNames[month - 1];
}

function getMonthNumber(monthName) {
  const monthNames = [
      "January", "February", "March", "April",
      "May", "June", "July", "August",
      "September", "October", "November", "December"
  ];

  return monthNames.indexOf(monthName) + 1;
}
module.exports = { generateUserToken, getAllThirdPartyOrganizations, getthirdpartyAnalytics,getMonthName }