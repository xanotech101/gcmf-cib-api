const config = require("../config/bankone");
const axios = require("axios");

class BankOneService {
  async accountByAccountNo(accountNo, authToken) {
    try {
      const { data } = await axios.get(
        `${config.getAccountByAccountNo}?authtoken=${authToken}&accountNumber=${accountNo}&computewithdrawableBalance=true`
      );
      return data;
    } catch (error) {
      console.log('service', error.response.data);
      throw error.response.data;;
    }
  }


  async accountByAccountNoV2(accountNo, authToken) {
    try {
      const { data } = await axios.get(
        `${config.getAccountByAccountNoV2}?authtoken=${authToken}&accountNumber=${accountNo}`
      );
      return data;
    } catch (error) {
      throw error.response.data;;
    }
  }

  async BulkOnboardingaccountByAccountNo(accountNo, authToken) {
    try {
      const { data } = await axios.get(
        `${config.getAccountByAccountNoV2}?authtoken=${authToken}&accountNumber=${accountNo}`
      );
      return data;
    } catch (error) {
      console.log(error.response.data)
    }
  }

  async accountByCustomerID(customerId, authToken) {
    try {
      const { data } = await axios.get(
        `${config.getAccountByCustomerID}?authtoken=${authToken}&customerId=${customerId}`
      );
      return data;
    } catch (error) {
      console.log('service', error.response.data);
      throw error.response.data;
    }
  }

  async transactionHistory(params) {
    try {

      const { data } = await axios.get(config.transactionHistory, {
        params
      });
      return data;
    } catch (error) {
      console.log('service', error.response.data);
      throw error.response.data;;
    }
  }

  async getAccountDetails(authToken, accountNumber, bankCode) {
    try {
      const { data } = await axios.post(`${config.nameEnquiry}`, {
        AccountNumber: accountNumber,
        BankCode: bankCode,
        Token: authToken,
      });
      return data;
    } catch (error) {
      console.log('service', error.response.data);
      throw error.response.data;;
    }
  }

  async getNameEnquiry(authToken, accountNumber, bankCode) {
    try {
      const { data } = await axios.post(`${config.nameEnquiry}`, {
        AccountNumber: accountNumber,
        BankCode: bankCode,
        Token: authToken,
      });
      return data;
    } catch (error) {
      console.log('service', error.response.data);
      throw error.response.data;;
    }
  }

  async getBVNEnquiry(authToken, bvn) {
    try {
      const { data } = await axios.post(`${config.bvnEnquiry}`, {
        BVN: bvn,
        Token: authToken,
      });
      return data;
    } catch (error) {
      console.log('service', error.response.data);
      throw error.response.data;;
    }
  }

  async getbankDetails(authToken, accountNumber) {
    try {
      const { data } = await axios.post(`${config.getAccountByAccountNo}`, {
        AccountNumber: accountNumber,
        Token: authToken,
      });
      return data;
    } catch (error) {
      console.log('service', error.response.data);
      throw error.response.data;;
    }
  }

  async accountStatement(authToken, accountNumber, fromDate, toDate, isPdf) {
    try {
      const { data } = await axios.get(
        `${config.accountStatement}?authtoken=${authToken}&accountNumber=${accountNumber}&fromDate=${fromDate}&toDate=${toDate}&isPdf=${isPdf}`
      );
      return data;
    } catch (error) {
      // return null;
      console.log('service', error.response.data);
      throw error.response.data;
    }
  }

  async doInterBankTransfer(
    payload
  ) {
    try {
      const {data}  = await axios.post(`${config.interbankTransfer}`, payload);
      return data;
    } catch (error) {
      console.log('service', error.response.data);
      throw error.response.data;
    }
  }

  async doIntraBankTransfer(payload) {
    try {
      const { data } = await axios.post(`${config.intrabankTransfer}`, payload);
      return data;
    } catch (error) {
      console.log('service', error.response.data);
      throw error.response.data;
    }
  }

  async getTransactionsPaginated(
    authToken,
    accountNumber,
    fromDate,
    toDate,
    institutionCode,
    pageNo,
    PageSize
  ) {
    try {
      const { data } = await axios.get(
        `${config.nameEnquiry}?authtoken=${authToken}&accountNumber=${accountNumber}&fromDate=${fromDate}&toDate=${toDate}&institutionCode=${institutionCode}&pageNo=${pageNo}&PageSize=${PageSize}`
      );
      return data;
    } catch (error) {
      console.log('service', error.response.data);
      throw error.response.data;
    }
  }

  async getAccountInfo(authtoken, accountNumber, institutionCode) {
    try {
      const { data } = await axios.get(
        `${config.getAccountInfo}?authtoken=${authToken}&accountNumber=${accountNumber}&institutionCode=${institutionCode}`
      );
      return data;
    } catch (error) {
      console.log('service', error.response.data);
      throw error.response.data;
    }
  }

  async transactionStatus(
    RetrievalReference,
    TransactionDate,
    TransactionType,
    Amount,
    Token
  ) {
    try {
      const { data } = await axios.post(`${config.transactionStatus}`, {
        RetrievalReference,
        TransactionDate,
        TransactionType,
        Amount,
        Token,
      });
      return data;
    } catch (error) {
      console.log('service', error.response.data);
      throw error.response.data;
    }
  }

  async getbankSumaryDetails(authToken, accountNumber) {
    try {
      const { data } = await axios.get(
        `${config.getAccountInfo}?authtoken=${authToken}&accountNumber=${accountNumber}`
      );
      return data;
    } catch (error) {
      console.log('service', error.response.data);
      throw error.response.data;
    }
  }

  async IntrabankAccountEnquiry(authToken, accountNumber) {
    try {
      const { data } = await axios.post(
        `${config.intraBankAccountEnquiry}`, {
        AccountNo: accountNumber,
        AuthenticationCode: authToken
      }
      );
      return data;
    } catch (error) {
      console.log('service', error.response.data);
      throw error.response.data;
    }
  }
}






module.exports = new BankOneService();
