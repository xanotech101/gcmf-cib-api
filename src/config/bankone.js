// register api endpoints here

const bankone = {
  getAccountByAccountNo:
    "http://52.168.85.231/BankOneWebAPI/swagger/ui/index#!/Account/Account_GetAccountByAccountNumber",
  getAccountByCustomerID:
    "http://52.168.85.231/BankOneWebAPI/swagger/ui/index#!/Account/Account_GetAccountsByCustomerId",
  transactionHistory:
    "http://52.168.85.231/BankOneWebAPI/swagger/ui/index#!/Account/Account_GetAllTransactionsPaginated",
  accountStatement:
    "http://52.168.85.231/BankOneWebAPI/swagger/ui/index#!/Account/Account_GenerateAccountStatement2",
  interbankTransfer:
    "http://52.168.85.231/thirdpartyapiservice/apiservice/Transfer/InterbankTransfer",
  intrabankTransfer:
    "http://52.168.85.231/thirdpartyapiservice/apiservice/CoreTransactions/LocalFundsTransfer ",
  nameEnquiry:
    "http://52.168.85.231/ThirdPartyAPIService/APIService/Transfer/NameEnquiry"
};

module.exports = bankone;