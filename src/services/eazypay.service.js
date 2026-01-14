const { default: axios } = require("axios");
const eazyPayConfig = require("../config/eazy-pay");
const qs = require("querystring");
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
        console.log(data)
        console.log(token)
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


    // async resetToken() {
    //     try {
    //         const formData = {
    //             client_id: process.env.MULIPAY_CLIENT_ID,
    //             scope: process.env.MULIPAY_SCOPE,
    //             client_secret: process.env.MULIPAY_CLIENT_SECRET,
    //             grant_type: process.env.MULIPAY_GRANT_TYPE,
    //         };

    //         const res = await this.http.post(
    //             eazyPayConfig.reset_token,
    //             qs.stringify(formData),
    //             {
    //                 headers: {
    //                     "Content-Type": "application/x-www-form-urlencoded",
    //                     "apiKey": process.env.MULIPAY_API_KEY
    //                 }
    //             }
    //         );

    //         const { access_token } = res.data;

    //         if (!access_token) {
    //             throw new Error("No access_token returned from EazyPay");
    //         }

    //         return access_token;

    //     } catch (err) {
    //         console.log(err)
    //         return err
    //         throw new Error(`Error resetting token: ${err.message}`);
    //     }
    // }

    async resetToken() {
        try {
            const formData = {
                client_id: process.env.MULIPAY_CLIENT_ID,
                scope: process.env.MULIPAY_SCOPE,
                client_secret: process.env.MULIPAY_CLIENT_SECRET,
                grant_type: process.env.MULIPAY_GRANT_TYPE,
            };

            const res = await this.http.post(
                eazyPayConfig.reset_token,
                qs.stringify(formData),
                {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        apiKey: process.env.MULIPAY_API_KEY,
                    },
                }
            );

            return res.data.access_token;
        } catch (err) {
            // Axios error structure
            if (err.response) {
                throw {
                    status: err.response.status,
                    provider: "Multipay / NIBSS",
                    data: err.response.data,
                    headers: err.response.headers,
                };
            }

            throw {
                status: 500,
                message: err.message || "Unknown error",
            };
        }
    }



}

module.exports = new EazyPayService();
