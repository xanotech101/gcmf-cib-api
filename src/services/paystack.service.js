const config = require("../config/paystack");
const axios = require("axios");

class PaystackService {
  async getBankList() {
    try {
      const { data } = await axios.get(config.bank_list);
      return data;
    } catch (error) {
      return null;
    }
  }

  async resolveAccount(params) {
    try {
      const { data } = await axios.get(config.resolve_account, {
        params,
        headers: {
          Authorization: `Bearer ${config.secret_key}`,
        },
      });
      return data;
    } catch (error) {
      return null;
    }
  }

  async createPaystackTransferReceipient(data) {
    try {
      const response = await axios.post(
        config.create_transfer_receipient,
        data,
        {
          headers: {
            Authorization: `Bearer ${config.secret_key}`,
          },
        }
      );
      return response.data;
    }
    catch (error) {
      throw new Error('Error creating transfer receipient');
    }
  }

  async bulkTransfers(data) {
  }
}

module.exports = new PaystackService();
