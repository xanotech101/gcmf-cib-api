const bankOneService = require("../../services/bankOne.service");

const getAccountByAccountNo = async (req, res) => {
  let accountNo = req.params.account;
  let authToken = "8424f843-fd36-4a30-8e7e-18f4f920aa91";

  const accountDetails = await bankOneService.accountByAccountNo(
    accountNo,
    authToken
  );
  if (!accountDetails) {
    return res.status(500).json({
      status: "Failed",
      message: "Unable to get bank account details",
    });
  }

  return res.status(200).json({
    status: "Success",
    message: "Account Details retrieved successfully",
    data: accountDetails,
  });
};

const getAccountByCustomerID = async (req, res) => {
  let customerId = req.params.customerId;
  console.log(customerId)
  let authToken = "8424f843-fd36-4a30-8e7e-18f4f920aa91";

  const accountDetails = await bankOneService.accountByCustomerID(
    customerId,
    authToken
  );

  if (!accountDetails) {
    return res.status(500).json({
      status: "Failed",
      message: "Unable to get bank account details",
    });
  }

  return res.status(200).json({
    status: "Success",
    message: "Account Details retrieved successfully",
    data: accountDetails,
  });
};

const getTransactionHistory = async (req, res) => {
  const fromDate = req.query.fromDate;
  const toDate = req.query.toDate;
  const productCode = req.query.productCode;
  const institutionCode = req.query.institutionCode;
  const pageNo = req.query.pageNo;
  const PageSize = req.query.PageSize;
  const authToken = "8424f843-fd36-4a30-8e7e-18f4f920aa91";

  const transHistory = await bankOneService.transactionHistory(
    authToken,
    fromDate,
    toDate,
    productCode,
    institutionCode,
    pageNo,
    PageSize
  );

  if (!transHistory) {
    return res.status(500).json({
      status: "Failed",
      message: "Unable to get bank account details",
    });
  }

  return res.status(200).json({
    status: "Success",
    message: "Account Details retrieved successfully",
    data: transHistory,
  });
};


const getAccountStatement = async (req, res) => {
  const fromDate = req.query.fromDate;
  const toDate = req.query.toDate;
  const isPdf = req.query.isPdf;
  const account = req.params.account;
  const authToken = "8424f843-fd36-4a30-8e7e-18f4f920aa91";

  console.log(account)

  const statement = await bankOneService.accountStatement(
    authToken,
    account,
    fromDate,
    toDate,
    isPdf
  );

  if (!statement) {
    return res.status(500).json({
      status: "Failed",
      message: "Unable to get bank account details",
    });
  }

  return res.status(200).json({
    status: "Success",
    message: "Account Details retrieved successfully",
    data: statement,
  });
};




const getTransactionsPaginated = async (req, res) => {
  const accountNumber = req.params.account;
  const fromDate = req.query.fromDate;
  const toDate = req.query.toDate;
  const institutionCode = req.query.institutionCode;
  const pageNo = req.query.pageNo;
  const PageSize = req.query.PageSize;
  const authToken = "8424f843-fd36-4a30-8e7e-18f4f920aa91";

  const getTransactions = await bankOneService.getTransactionsPaginated(
    authToken,
    accountNumber,
    fromDate,
    toDate,
    institutionCode,
    pageNo,
    PageSize
  );

  if (!getTransactions) {
    return res.status(500).json({
      status: "Failed",
      message: "Unable to get bank account details",
    });
  }

  return res.status(200).json({
    status: "Success",
    message: "Account Details retrieved successfully",
    data: getTransactions,
  });
};

module.exports = {
  getAccountByAccountNo,
  getAccountByCustomerID,
  getTransactionHistory,
  getAccountStatement,
  // getNameEnquiry
  getTransactionsPaginated,
};
