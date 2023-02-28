const config = require("../config/bankine");
const axios = require("axios");

class BankOneService {
  async getAccountByAccountNo() {
    try {
      const { data } = await axios.get(config.getAccountByAccountNo);
      return data;
    } catch (error) {
      return null;
    }
  }

  async getAccountByCustomerID() {
    try {
      const { data } = await axios.get(config.getAccountByCustomerID);
      return data;
    } catch (error) {
      return null;
    }
  }

  async getTransactionHistory() {
    try {
      const { data } = await axios.get(config.transactionHistory);
      return data;
    } catch (error) {
      return null;
    }
  }

  async getAccountStatement() {
    try {
      const { data } = await axios.get(config.accountStatement);
      return data;
    } catch (error) {
      return null;
    }
  }

  async getInterbankTransfer() {
    try {
      const { data } = await axios.get(config.interbankTransfer);
      return data;
    } catch (error) {
      return null;
    }
  }

  async getIntrabankTransfer() {
    try {
      const { data } = await axios.get(config.intrabankTransfer);
      return data;
    } catch (error) {
      return null;
    }
  }

  async getNameEnquiry() {
    try {
      const { data } = await axios.get(config.nameEnquiry);
      return data;
    } catch (error) {
      return null;
    }
  }

  async getNameEnquiry() {
    try {
      const { data } = await axios.get("https://api.publicapis.org/entries");
      return data;
    } catch (error) {
      return null;
    }
  }
}


module.exports = new BankOneService();




