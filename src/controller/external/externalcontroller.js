const jwt = require("jsonwebtoken");
const thirdPartyModel = require("../../model/thirdParty.model");
const organization = require("../../model/organization");
const thirdPartyRequestCOuntModel = require("../../model/thirdpartyCount.model");
const { default: mongoose } = require("mongoose");
const { notificationService } = require("../../services");
const initiateRequestModel = require("../../model/initiateRequest.model");
const whitelistAccounts = require("../../model/whitelistAccounts");
const { QueueTransfer } = require("../../services/messageQueue/queue");
const bankOneService = require("../../services/bankOne.service");
const bcrypt = require('bcrypt')

const authToken = process.env.AUTHTOKEN;

const generateRandomNumber = () => {
  return Math.floor(100000000000000 + Math.random() * 900000000000000); 
};


async function createExternalOrganization(req, res) {
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
      return res.status(400).send({
        success: false,
        message: 'organization already registered to the system',
      })
    }

    const generateKey = generateRandomNumber().toString();

    const salt = await bcrypt.genSalt(15);
    const hashKey = await bcrypt.hash(generateKey, salt);


    const createOrg = await thirdPartyModel.create({
      organization_name: req.body.organization_name,
      key: hashKey,
      requestCount: [],
      bvnCount: []
    })

    if (!createOrg) {
      return res.status(500).send({
        success: false,
        message: 'error creating organization'
      })
    }

    return res.status(200).send({
      success: true,
      message: 'organization created, please note your key is revealed only this time, do well to save it privately.',
      data: {
        organization: createOrg,
        key: generateKey
      }
    })

  } catch (error) {
    console.log(error)
    res.status(500).send({
      success: false,
      message: error.message
    })
  }
}

// async function generateUserToken(req, res) {
//   try {
//     if (!req.body.organization_name || !req.body.key) {
//       return res.status(400).send({
//         success: false,
//         message: 'Organization name and key are required'
//       });
//     }

//     const organization = await thirdPartyModel.findOne({ organization_name: req.body.organization_name });
//     if (!organization) {
//       return res.status(404).send({
//         success: false,
//         message: 'Organization does not exist'
//       });
//     }

//     const keyMatch = await bcrypt.compare(req.body.key, organization.key);
//     if (!keyMatch) {
//       return res.status(401).send({
//         success: false,
//         message: 'Invalid key, if you dont have a valid key please contact your administrator to get a key'
//       });
//     }

//     const token = jwt.sign(
//       { organization_name: req.body.organization_name },
//       process.env.JWT_SECRET,
//       { expiresIn: "15d" }
//     );

//     await thirdPartyModel.findOneAndUpdate(
//       { organization_name: req.body.organization_name },
//       { $set: { requestCount: [], bvnCount: [] } },
//       { upsert: true }
//     );

//     return res.status(200).send({
//       success: true,
//       message: 'Organization now has access',
//       data: token
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).send({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// }

async function generateUserToken(req, res) {
  try {
    const { organization_name, key } = req.body;

    if (!organization_name || !key) {
      return res.status(400).json({ success: false, message: 'Organization name and key are required' });
    }

    const organization = await thirdPartyModel.findOne({ organization_name }).select('_id key').lean();  
    if (!organization) {
      return res.status(404).json({ success: false, message: 'Organization does not exist' });
    }

    const isMatch = await bcrypt.compare(key, organization.key);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid key' });
    }

    const token = jwt.sign(
      { organization_name, organization_id: organization._id },
      process.env.JWT_SECRET,
      { expiresIn: "15d" }
    );

    await thirdPartyModel.updateOne(
      { _id: organization._id },
      { $set: { requestCount: [], bvnCount: [] } }
    );

    return res.status(200).json({
      success: true,
      message: 'Organization now has access',
      data: { token }
    });

  } catch (error) {
    console.error('Error generating token:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function updateOrganizationKey(req, res) {
  try {
    const organizationName = req.body.organization_name;
    const newKey = generateRandomNumber().toString(); 

    const salt = await bcrypt.genSalt(15);
    const hashKey = await bcrypt.hash(newKey, salt);

    const organization = await thirdPartyModel.findOne({ organization_name: organizationName });
    if (!organization) {
      return res.status(404).send({
        success: false,
        message: 'Organization not found'
      });
    }

    organization.key = hashKey;
    await organization.save();

    return res.status(200).send({
      success: true,
      message: 'Key updated successfully, please note your key is revealed only this time, do well to save it privately.',
      data: {
        organization: organizationName,
        key: newKey 
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).send({
      success: false,
      message: 'Internal server error'
    });
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
          .countDocuments({ userid: _id, requestType: 'Bvn' })
          .lean();

        // Fetch count for NameEnquiry
        const nameEnquiryCount = await thirdPartyRequestCOuntModel
          .countDocuments({ userid: _id, requestType: 'NameEnquiry' })
          .lean();

        const transferRequestCount = await thirdPartyRequestCOuntModel
          .countDocuments({ userid: _id, requestType: 'TransferRequest' })
          .lean();

        result.BvnCount = bvnCount; // Add Bvn count to the result object
        result.NameEnquiryCount = nameEnquiryCount; // Add NameEnquiry count to the result object
        result.TransferRequestCount = transferRequestCount
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

const initiateRequest = async (req, res) => {
  try {

    // check if payerAccountNumber is whitelisted
    const check_whitelisted = await whitelistAccounts.findOne({ account_number: req.body.payerAccountNumber })
    if (!check_whitelisted) {
      return res.status(400).send({
        success: false,
        message: `${req.body.payerAccountNumber} is not authorized to make this transaction.`
      })
    }

    let accountInfo

    if (req.body.type == 'inter-bank') {
      accountInfo = await bankOneService.getNameEnquiry(authToken, req.body.beneficiaryAccountName, req.body.beneficiaryBankCode)
    } else {
      accountInfo = await bankOneService.IntrabankAccountEnquiry(authToken, req.body.beneficiaryAccountName)
    }
    if (!accountInfo.IsSuccessful) {
      return res.status(400).send({
        success: false,
        message: `Error getting beneficiary account information kindly check your beneficiary account number`
      })
    }
    const request = new initiateRequestModel({
      NIPSessionID: accountInfo.SessionID,
      amount: req.body.amount,
      narration: req.body.narration,
      payerAccountNumber: req.body.payerAccountNumber,
      beneficiaryAccountName: accountInfo.Name,
      beneficiaryAccountNumber: req.body.beneficiaryAccountNumber,
      beneficiaryAccountType: req.body.beneficiaryAccountType,
      beneficiaryBVN: accountInfo.BVN,
      beneficiaryBankCode: req.body.beneficiaryBankCode,
      beneficiaryBankName: req.body.beneficiaryBankName,
      beneficiaryKYC: accountInfo.KYC,
      beneficiaryPhoneNumber: accountInfo.PhoneNuber,
      transactionReference: mongoose.Types.ObjectId().toString().substr(0, 12),
      type: req.body.type,
      channel: 'third-party',
      userId: req.user._id
    });


    request.initiator = req.user._id;
    request.narration = ('Transfer from ' + req.user?.organization_name + ' to ' + req.body.beneficiaryAccountName + '\\\\' + req.body.narration)?.slice(0, 100);

    const result = await request.save();

    await thirdPartyRequestCOuntModel.create({
      userid: req.user._id,
      requestType: 'TransferRequest'
    })

    if (result.type === "inter-bank") {
      const payload = {
        _id: result._id,
        Amount: request.amount * 100,
        Payer: request.payerAccountNumber,
        PayerAccountNumber: request.payerAccountNumber,
        ReceiverAccountNumber: request.beneficiaryAccountNumber,
        ReceiverAccountType: request.beneficiaryAccountType,
        ReceiverBankCode: request.beneficiaryBankCode,
        ReceiverPhoneNumber: request.beneficiaryPhoneNumber,
        ReceiverName: request.beneficiaryBankName,
        ReceiverBVN: "",
        ReceiverKYC: "",
        TransactionReference: result.transactionReference,
        NIPSessionID: request.NIPSessionID,
        Token: authToken,
        Narration: request.narration,
      };

      QueueTransfer(payload, 'inter-bank')
    } else {
      const payload = {
        _id: result._id,
        Amount: request.amount * 100,
        RetrievalReference: result.transactionReference,
        FromAccountNumber: request.payerAccountNumber,
        ToAccountNumber: request.beneficiaryAccountNumber,
        AuthenticationKey: authToken,
        Narration: request.narration,
      };
      QueueTransfer(payload, 'intra-bank')
    }

    return res.status(201).json({
      message: "Request initiated successfully and sent for approval",
      data: result,
    });
  } catch (error) {
    console.log(error)
    res.status(500).json({
      message: error.message,
      status: "failed",
    });
  }
};

const getAllTransactionByThirdParty = async (req, res) => {
  try {
    let { page, limit, sortBy, sortOrder } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    sortBy = sortBy || '_id'; // Default sorting field
    sortOrder = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const query = initiateRequestModel.find({ userId: req.user._id, channel: 'third-party' })
      .populate('userId')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);

    const transactions = await query.exec();

    const total = await initiateRequestModel.countDocuments({ userId: req.user._id, channel: 'third-party' });

    const totalPages = Math.ceil(total / limit);

    res.status(200).send({
      data: {
        items: transactions,
        page: page,
        limit: limit,
        total: total,
        totalPages: totalPages,
      },
      message: 'all transactions fetched successfully',
      success: true,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({
      success: false,
      message: 'Internal Server Error'
    });
  }
};


module.exports = { generateUserToken, getAllThirdPartyOrganizations, 
  getthirdpartyAnalytics, getMonthName, initiateRequest, getAllTransactionByThirdParty, 
  updateOrganizationKey,
  createExternalOrganization }