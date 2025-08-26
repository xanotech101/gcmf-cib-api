const { default: axios } = require("axios");
const eazyPayConfig = require("../config/eazy-pay");

const CLIENT_CODE = "GROOMINGTEST";

class EazyPayService {
    constructor() {
        this.http = axios.create({
            headers: {
                "Content-Type": "application/json",
                "clientcode": CLIENT_CODE
            }
        });
    }

    async openBatch(data, token) {
        try {
            const res = await this.http.post(eazyPayConfig.batch_open, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data;
        } catch (err) {
            throw new Error(`Error opening batch: ${err.message}`);
        }
    }

    async addItemToBatch(batchId, data, token) {
        try {
            const url = `${eazyPayConfig.add_itme_to_batch}/${batchId}`;
            const res = await this.http.put(url, data, {
                headers: { Authorization: `Bearer ${token}` },
                params: { BatchId: batchId }
            });
            return res.data;
        } catch (err) {
            throw new Error(`Error adding items to batch: ${err.message}`);
        }
    }

    async closeBatch(batchId, token) {
        try {
            const url = `${eazyPayConfig.close_batch}/${batchId}`;
            const res = await this.http.put(url, {}, {
                headers: { Authorization: `Bearer ${token}` },
                params: { BatchId: batchId }
            });
            return res.data;
        } catch (err) {
            throw new Error(`Error closing batch: ${err.message}`);
        }
    }

    async submitBatch(data, token) {
        try {
            const res = await this.http.post(eazyPayConfig.submit_batch, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data;
        } catch (err) {
            throw new Error(`Error submitting batch: ${err.message}`);
        }
    }

    async Tsq(batchId, token) {
        try {
            const url = `${eazyPayConfig.transfer_status}/${batchId}`;
            const res = await this.http.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data;
        } catch (err) {
            throw new Error(`Error checking transaction status: ${err.message}`);
        }
    }

    async TransactionDetails(batchId, transactionId, token) {
        try {
            const url = `${eazyPayConfig.transaction_details}/${batchId}/${transactionId}`;
            const res = await this.http.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data;
        } catch (err) {
            throw new Error(`Error checking transaction details: ${err.message}`);
        }
    }

}

module.exports = new EazyPayService();
