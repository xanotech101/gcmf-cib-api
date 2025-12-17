// register api endpoints here

const bankone = {
  getAccountByAccountNo:
    `${process.env.BankOneUrl}/BankOneWebAPI/api/Account/GetAccountByAccountNumber/2/`,
  getAccountByAccountNoV2:
    `${process.env.BankOneUrl}/BankOneWebAPI/api/Customer/GetByAccountNumber/2/`,
  getAccountByCustomerID:
    `${process.env.BankOneUrl}/BankOneWebAPI/api/Account/GetAccountsByCustomerId/2/`,
  accountStatement:
    `${process.env.BankOneUrl}/BankOneWebAPI/api/Account/GenerateAccountStatement2/2`,
  interbankTransfer:
    `${process.env.BankOneUrl}/thirdpartyapiservice/apiservice/Transfer/InterbankTransfer`,
  intrabankTransfer:
    `${process.env.BankOneUrl}/thirdpartyapiservice/apiservice/CoreTransactions/LocalFundsTransfer`,
  nameEnquiry:
    `${process.env.BankOneUrl}/thirdpartyapiservice/apiservice/Transfer/NameEnquiry`,
  transactionHistory:
    `${process.env.BankOneUrl}/BankOneWebAPI/api/Account/GetTransactionsPaginated/2`,
  getAccountInfo: `${process.env.BankOneUrl}/BankOneWebAPI/api/Account/GetAccountSummary/2`,
  transactionStatus: `${process.env.BankOneUrl}/thirdpartyapiservice/apiservice/CoreTransactions/TransactionStatusQuery`,
  bvnEnquiry: `${process.env.BankOneUrl}/thirdpartyapiservice/apiservice/Account/BVN/GetBVNDetails`,
  intraBankAccountEnquiry: `${process.env.BankOneUrl}/thirdpartyapiservice/apiservice/Account/AccountEnquiry`,
  debitAccount: `${process.env.BankOneUrl}/thirdpartyapiservice/apiservice/CoreTransactions/Debit`
};

module.exports = bankone;
