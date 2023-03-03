const config = require("../config/bankone");
const axios = require("axios");

class BankOneService {
  async accountByAccountNo(accountNo, authToken) {
    try {
      const { data } = await axios.get(
        `${config.getAccountByAccountNo}?authtoken=${authToken}&accountNumber=${accountNo}`
      );
      return data;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async accountByCustomerID(customerId, authToken) {
    try {
      const { data } = await axios.get(
        `${config.getAccountByCustomerID}?authtoken=${authToken}&customerId=${customerId}`
      );
      return data;
    } catch (error) {
      console.log(error.message);
      return null;
    }
  }

  async transactionHistory(
    authToken,
    fromDate,
    toDate,
    productCode,
    institutionCode,
    pageNo,
    PageSize
  ) {
    try {
      const { data } = await axios.get(
        `${config.transactionHistory}?authtoken=${authToken}&fromDate=${fromDate}&toDate=${toDate}&productCode=${productCode}&institutionCode=${institutionCode}&pageNo=${pageNo}&PageSize=${PageSize}`
      );
      return data;
    } catch (error) {
      console.log(error);
      return null;
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
      console.log(error);
      return null;
    }
  }

  async getMultipleNameEnquiry (authToken, payload) {
    const promises = payload.map((item) => {
      return axios.post(`${config.nameEnquiry}`, {
        AccountNumber: item.accountNumber,
        BankCode: item.bankCode,
        Token: authToken,
      });
    });

    const results = await Promise.allSettled(promises);

    const successfulPromises = results.filter((promise) => promise.status === "fulfilled");
    const data = successfulPromises.map((promise) => promise.value.data);

    const failedPromise = results.filter((promise) => promise.status === "rejected");
    const failedPayload = failedPromise.map((promise) => promise.reason.config.data);

    console.log(failedPromise, failedPayload);

    return {
      data,
      failedPayload,
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
      console.log(error);
    }
  }

  async getInterbankTransfer() {
    try {
      const { data } = await axios.get(`${config.interbankTransfer}`);
      return data;
    } catch (error) {
      return null;
    }
  }

  async getIntrabankTransfer() {
    try {
      const { data } = await axios.post(`${config.intrabankTransfer}`);
      return data;
    } catch (error) {
      return null;
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
      const { data } = await axios.post(
        `${config.nameEnquiry}?authtoken=${authToken}&accountNumber=${accountNumber}&fromDate=${fromDate}&toDate=${toDate}&institutionCode=${institutionCode}&pageNo=${pageNo}&PageSize=${PageSize}`
      );
      return data;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
}


module.exports = new BankOneService();




