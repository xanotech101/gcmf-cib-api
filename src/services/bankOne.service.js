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
      // return null;
      console.log(error.message)
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
      return null;
    }
  }

  async accountStatement(
    authToken,
    accountNumber,
    fromDate,
    toDate,
    isPdf,
  ) {
    try {
      const { data } = await axios.get(
        `${config.accountStatement}?authtoken=${authToken}&accountNumber=${accountNumber}&fromDate=${fromDate}&toDate=${toDate}&isPdf=${isPdf}`
      );
      return data;
    } catch (error) {
      // return null;
      console.log(error)
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

    async getNameEnquiry(
        authToken,
        accountNumber,
        institutionCode) {
    try {
      const { data } = await axios.post(
        `${config.nameEnquiry}?authtoken=${authToken}&accountNumber=${accountNumber}&institutionCode=${institutionCode}`
      );
      return data;
    } catch (error) {
      // return null;
      console.log(error)
    }
  }
}


module.exports = new BankOneService();




