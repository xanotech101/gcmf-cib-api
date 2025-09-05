const config = require("../config/paystack");
const axios = require("axios");
const logger = require('../utils/logger')

class PaystackService {
  async getBankList() {
    try {
      const { data } = await axios.get(config.bank_list);
      return data;
    } catch (error) {
      logger.error({ error }, "Error fetching bank list");
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
      logger.error({ error }, "Error resolving account");
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
      logger.error({ error }, "Error creating Paystack transfer recipient");
      throw new Error("Error creating Paystack transfer recipient");
    }
  }

  /**
   * Initiates a bulk transfer using Paystack's bulk transfer endpoint.
   *
   * @param {Object} data - The bulk transfer payload.
   * @param {Array<Object>} data.transfers - Array of transfer objects.
   * @param {number} data.transfers[].amount - Amount to transfer (in kobo).
   * @param {string} data.transfers[].reference - Unique reference for the transfer.
   * @param {string} data.transfers[].reason - Reason for the transfer.
   * @param {string} data.transfers[].recipient - Paystack recipient code.
   * @returns {Promise<Object>} The response data from Paystack API.
   * @throws {Error} If the bulk transfer fails.
   *
   * @example
   * const payload = {
   *   currency: "NGN",
   *   source: "balance",
   *   transfers: [
   *     {
   *       amount: 20000,
   *       reference: "acv_2627bbfe-1a2a-4a1a-8d0e-9d2ee6c31496",
   *       reason: "Bonus for the week",
   *       recipient: "RCP_gd9vgag7n5lr5ix",
   *     }
   *   ]
   * };
   *
  * const result = await paystackService.bulkTransfers(payload);
  *
  * Sample response:
  * {
  *   status: true,
  *   message: "3 transfers queued.",
  *   data: [
  *     {
  *       reference: "acv_2627bbfe-1a2a-4a1a-8d0e-9d2ee6c31496",
  *       recipient: "RCP_gd9vgag7n5lr5ix",
  *       amount: 20000,
  *       transfer_code: "TRF_o0mv5dc2lv4t2wdb",
  *       currency: "NGN",
  *       status: "success"
  *     },
  *     // ...more transfers
  *   ]
  * }
  */
  async bulkTransfers(data) {
    try {
      const {data} = await axios.post(config.bulk_transfer, data, {
        headers: {
          Authorization: `Bearer ${config.secret_key}`,
        },
      });
      return data;
    } catch (error) {
      logger.error({ error }, "Error initiating bulk transfer");
      throw new Error("Error initiating bulk transfer");
    }
  }
}

module.exports = new PaystackService();
