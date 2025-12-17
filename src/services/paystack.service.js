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
      logger.error({ error: error.response?.data || error }, "Paystack Transfer Recipient Error");

      if (error.response && error.response.data) {
        const paystackError = error.response.data;

        throw {
          status: false,
          message: paystackError.message || "Failed to create transfer recipient",
          code: paystackError.code || null,
          errors: paystackError.errors || null,
        };
      }

      throw {
        status: false,
        message: "Unable to reach Paystack service",
        code: "network_error",
      };
    }
  }

  async sendBulkTransferToPaystack(transfers = []) {
    try {
      const payload = {
        currency: "NGN",
        source: "balance",
        transfers,
      };

      const { data } = await axios.post(
        config.bulk_transfer,
        payload,
        {
          headers: {
            Authorization: `Bearer ${config.secret_key}`,
          },
        }
      );

      return data;
    } catch (err) {
      logger.error("Paystack Bulk Transfer Error:", err.response?.data || err);
      return null
    }
  }

  async getTransferStatus(transferCode) {
    try {
      const { data } = await axios.get(
        `${config.transfer_status}/${transferCode}`,
        { headers: headers() }
      );
      return data;
    } catch (err) {
      logger.error({ err: err.response?.data || err }, 'Paystack get transfer status error');
      throw err.response?.data || err;
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
  async sendBulkTransferToPaystack(transfers) {
    try {
      const payload = {
        currency: "NGN",
        source: "balance",
        transfers,
      };

      const { data } = await axios.post(
        config.bulk_transfer,
        payload,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`,
            "Content-Type": "application/json",
          },
        }
      );

      return data;
    } catch (error) {
      console.error(
        "Paystack bulk transfer error:",
        error.response?.data || error
      );
      throw error.response?.data || error;
    }
  }

  async verifyPaystackTransfer(transferCode) {
    try {
      const { data } = await axios.get(
        `${config.transfer_status}/${transferCode}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`,
          },
        }
      );

      return data;
    } catch (error) {
      console.error(
        "Paystack transfer verification error:",
        error.response?.data || error
      );
      throw error.response?.data || error;
    }
  }


}

module.exports = new PaystackService();
