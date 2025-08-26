const config = require("../config/paystack");
const axios = require("axios");
const logger = require('../utils/logger')

class PaystackService {
  async getBankList() {
    try {
      const { data } = await axios.get(config.bank_list);
      return data;
    } catch (error) {
      logger.error({ error }, 'Error fetching bank list');
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
      logger.error({ error }, 'Error resolving account');
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
    } catch (error) {
      logger.error({ error }, 'Error creating Paystack transfer recipient');
      throw new Error("Error creating Paystack transfer recipient");
    }
  }

  async bulkTransfers(data) {
    try {
      const response = await axios.post(config.bulk_transfer, data, {
        headers: {
          Authorization: `Bearer ${config.secret_key}`,
        },
      });
      return response.data;
    } catch (error) {
      logger.error({ error }, 'Error initiating bulk transfer');
      throw new Error("Error initiating bulk transfer");
    }
  }
}

module.exports = new PaystackService();
