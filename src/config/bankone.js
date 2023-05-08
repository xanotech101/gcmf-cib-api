// register api endpoints here

const bankone = {
  getAccountByAccountNo:
    `${process.env.BankOneUrl}/BankOneWebAPI/api/Account/GetAccountByAccountNumber/2/`,
    getAccountByAccountNoV2:
    `${process.env.BankOneUrl}/BankOneWebAPI/api/Customer/GetByAccountNumber/2/`,
  getAccountByCustomerID:
    `${process.env.BankOneUrl}/BankOneWebAPI/api/Account/GetAccountsByCustomerId/2/`,
  transactionHistory:
    `${process.env.BankOneUrl}/BankOneWebAPI/api/Account/GetTransactions/2`,
  accountStatement:
    `${process.env.BankOneUrl}/BankOneWebAPI/api/Account/GenerateAccountStatement2/2`,
  interbankTransfer:
    `${process.env.BankOneUrl}/thirdpartyapiservice/apiservice/Transfer/InterbankTransfer`,
  intrabankTransfer:
    `${process.env.BankOneUrl}/thirdpartyapiservice/apiservice/CoreTransactions/LocalFundsTransfer`,
  nameEnquiry:
    `${process.env.BankOneUrl}/thirdpartyapiservice/apiservice/Transfer/NameEnquiry`,
  getTransactions:
    `${process.env.BankOneUrl}/BankOneWebAPI/api/Account/GetTransactionsPaginated/2`,
  getAccountInfo: `${process.env.BankOneUrl}/BankOneWebAPI/api/Account/GetAccountSummary/2`,
  transactionStatus: `${process.env.BankOneUrl}/thirdpartyapiservice/apiservice/CoreTransactions/TransactionStatusQuery`
};

module.exports = bankone;
