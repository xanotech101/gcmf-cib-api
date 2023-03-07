const bankOneService = require("../../services/bankOne.service");
const authToken = process.env.AUTHTOKEN;

const getAccountByAccountNo = async (req, res) => {
  let accountNo = req.params.account || "00680011010004232";
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
  let customerId = req.params.customerId || "004232";

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

  console.log(account);

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
};

const getAccountDetails = async (req, res) => {
  const { accountNumber } = req.params;

  const accountDetails = await bankOneService.getbankDetails(
    authToken,
    accountNumber
  );

  if (!accountDetails) {
    return res.status(500).json({
      status: "Failed",
      message: "Unable to get bank account details",
    });
  }

  return res.status(200).json({
    status: "Success",
    message: "Name account details retrieved successfully",
    data: accountDetails,
  });
};
const getNameEnquiry = async (req, res) => {
  const { accountNumber, bankCode } = req.body;

  const enquiry = await bankOneService.getNameEnquiry(
    authToken,
    accountNumber,
    bankCode
  );

  if (!enquiry) {
    return res.status(500).json({
      status: "Failed",
      message: "Unable to get bank account details",
    });
  }

  return res.status(200).json({
    status: "Success",
    message: "Name Enquiry retrieved successfully",
    data: enquiry,
  });
};

const getTransactionsPaginated = async (req, res) => {
  const accountNumber = req.params.account;
  const fromDate = req.query.fromDate;
  const toDate = req.query.toDate;
  const institutionCode = req.query.institutionCode;
  const pageNo = req.query.pageNo;
  const PageSize = req.query.PageSize;

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

const interbankTransfer = async (req, res) => {
  const {
    Amount,
    Payer,
    ReceiverAccountNumber,
    PayerAccountNumber,
    ReceiverAccountType,
    ReceiverBankCode,
    ReceiverPhoneNumber,
    ReceiverName,
    ReceiverBVN,
    ReceiverKYC,
    Narration,
    TransactionReference,
    NIPSessionID,
  } = req.body;

  const interTransfer = await bankOneService.getInterbankTransfer(
    Amount,
    Payer,
    ReceiverAccountNumber,
    PayerAccountNumber,
    ReceiverAccountType,
    ReceiverBankCode,
    ReceiverPhoneNumber,
    ReceiverName,
    ReceiverBVN,
    ReceiverKYC,
    Narration,
    TransactionReference,
    NIPSessionID
  );

  if (!interTransfer) {
    return res.status(500).json({
      status: "Failed",
      message: "Unable to get bank account details",
    });
  }

  return res.status(200).json({
    status: "Success",
    message: "Account Details retrieved successfully",
    data: interTransfer,
  });
};

module.exports = {
  getAccountByAccountNo,
  getAccountByCustomerID,
  getTransactionHistory,
  getAccountStatement,
  getNameEnquiry,
  getTransactionsPaginated,
  interbankTransfer,
  getAccountDetails,
};

// {
//     "AccountNumber" : "0230650585",
//     "BankCode" : "035",
//     "Token" : "8424f843-fd36-4a30-8e7e-18f4f920aa91"
// }
