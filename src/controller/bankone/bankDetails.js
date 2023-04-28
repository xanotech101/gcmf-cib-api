const bankOneService = require("../../services/bankOne.service");
const authToken = process.env.AUTHTOKEN;

const getAccountByAccountNo = async (req, res) => {

  try {
    const accountDetails = await bankOneService.accountByAccountNo(
      req.params.accountNo,
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
  } catch (error) {
    return res.status(500).json({
      status: "Failed",
      message: error,
    });
  }
}


const getAccountByCustomerID = async (req, res) => {
  try {
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

  } catch (error) {
    console.log('controller', error)
    return res.status(500).json({
      status: "Failed",
      message: error,
    });
  }

};

const getTransactionHistory = async (req, res) => {
  try {
    const accountNumber = req.params.accountNo;
    const fromDate = req.query.fromDate;
    const toDate = req.query.toDate;
    const numberOfItems = req.query.numberOfItems;
    const authtoken = process.env.AUTHTOKEN;
  
    const transHistory = await bankOneService.transactionHistory(
      authtoken,
      accountNumber,
      fromDate,
      toDate,
      numberOfItems
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
  } catch (error) {
    console.log('controller', error)
    return res.status(500).json({
      status: "Failed",
      message: error,
    });
  }
};

const getAccountStatement = async (req, res) => {
  const fromDate = req.query.fromDate;
  const toDate = req.query.toDate;
  const isPdf = req.query.isPdf;
  const account = req.params.account;

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
    message: statement,
  });

};

const getAccountDetails = async (req, res) => {
  try {
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
  } catch (error) {
    console.log('controller', error)
    return res.status(500).json({
      status: "Failed",
      message: error,
    });
  }
};

const getNameEnquiry = async (req, res) => {
  try {
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
  } catch (error) {
    console.log('controller', error)
    return res.status(500).json({
      status: "Failed",
      message: error,
    });
  }
};

const getTransactionsPaginated = async (req, res) => {
  try {
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
  } catch (error) {
    console.log('controller', error)
    return res.status(500).json({
      status: "Failed",
      message: error,
    });
  }
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

const getAccountInfo = async (req, res) => {
  try {
    let accountNumber = req.query.accountNumber;

    const accountInfo = await bankOneService.getbankSumaryDetails(
      authToken,
      accountNumber
    );
    if (!accountInfo) {
      return res.status(500).json({
        status: "Failed",
        message: "Unable to get bank account details",
      });
    }

    return res.status(200).json({
      status: "Success",
      message: "Account Details retrieved successfully",
      data: accountInfo,
    });
  } catch (error) {
    console.log('controller', error)
    return res.status(500).json({
      status: "Failed",
      message: error,
    });
  }
};

const getTransactionStatus = async (req, res) => {
  try {
    let RetrievalReference = req.body.RetrievalReference;
    let TransactionDate = req.body.TransactionDate;
    let institutionCode = req.body.institutionCode;
    let Amount = req.body.Amount;

    const transactionStatusInfo = await bankOneService.transactionStatus(
      RetrievalReference,
      TransactionDate,
      TransactionType,
      Amount,
      authToken,
    )
    if (!transactionStatusInfo) {
      return res.status(500).json({
        status: "Failed",
        message: "Unable to get bank account details",
      });
    }

    return res.status(200).json({
      status: "Success",
      message: "Account Details retrieved successfully",
      data: transactionStatusInfo,
    });
  } catch (error) {
    console.log('controller', error)
    return res.status(500).json({
      status: "Failed",
      message: error,
    });
  }
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
  getAccountInfo,
  getTransactionStatus
};





