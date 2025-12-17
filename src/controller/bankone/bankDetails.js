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


const getAccountByAccountNoV2 = async (req, res) => {
  try {

    const accountDetails = await bankOneService.accountByAccountNoV2(
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
    console.log('controller', error)
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
    const params = {
      accountNumber: req.params.accountNo,
      authtoken: process.env.AUTHTOKEN,
      fromDate: req.query.fromDate,
      toDate: req.query.toDate,
      pageNo: req.query.pageNo || 1,
      PageSize: req.query.PageSize || 50,
    }

    const transHistory = await bankOneService.transactionHistory(params);

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

const bvnEnquiry = async (req, res) => {
  try {
    const { bvn } = req.body;

    const enquiry = await bankOneService.getBVNEnquiry(
      authToken,
      bvn
    );

    if (!enquiry) {
      return res.status(500).json({
        status: "Failed",
        message: "Unable to get BVN details",
      });
    }

    return res.status(200).json({
      status: "Success",
      message: "BVN Enquiry retrieved successfully",
      data: enquiry,
    });

  } catch (error) {
    console.log('controller', error)
    return res.status(500).json({
      status: "Failed",
      message: error,
    });
  }
}

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


const IntrabankAccountEnquiry = async (req, res) => {
  try {
    const AccountEnquiryInfo = await bankOneService.IntrabankAccountEnquiry(
      authToken,
      req.body.AccountNo
    )
    if (!AccountEnquiryInfo) {
      return res.status(500).json({
        status: "Failed",
        message: "Unable to get account details",
      });
    }

    return res.status(200).json({
      status: "Success",
      message: "Account Details retrieved successfully",
      data: AccountEnquiryInfo,
    });
  } catch (error) {
    console.log('controller', error)
    return res.status(500).json({
      status: "Failed",
      message: error,
    });
  }
};

const debitAccount = async (req, res) => {
  try {
    const { accountNumber, amount } = req.body
    const DebitAccount = await bankOneService.debitCustomerAccount({
      accountNumber,
      amount,
      authToken,
    })
    if (!DebitAccount.IsSuccessful) {
      return res.status(500).json({
        status: "Failed",
        message: "Unable to get debit account",
        data: DebitAccount,
      });
    }

    return res.status(200).json({
      status: "Success",
      message: "account debit successfully",
      data: DebitAccount,
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
  IntrabankAccountEnquiry,
  getAccountByAccountNo,
  getAccountByCustomerID,
  getTransactionHistory,
  getAccountStatement,
  getNameEnquiry,
  interbankTransfer,
  getAccountDetails,
  getAccountInfo,
  getTransactionStatus,
  getAccountByAccountNoV2,
  bvnEnquiry,
  debitAccount
};





