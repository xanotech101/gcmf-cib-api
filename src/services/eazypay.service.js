const { default: axios } = require("axios");
const eazyPayConfig = require("../config/easy-pay");

class EazyPayService {
    async bulkTransfers(data, token) {
        try {
            const response = await axios.post(
                eazyPayConfig.bulk_transfer,
                data,
                {
                    headers: {
                        "Content-Type": 'application/json',
                        "Authorization": `Bearer ${token}`
                    }
                }
            )
            return response.data
        } catch (error) {
            throw new Error('Error initiating bulk transfer with eazy pay');
        }
    }

    async balanceEnquiry(data, token) {
        try {
            const response = await axios.post(
                eazyPayConfig.balance_enquiry,
                data,
                {
                    headers: {
                        "Content-Type": 'application/json',
                        "Authorization": `Bearer ${token}`
                    }
                }
            )
            return response.data
        } catch (error) {
            const errorMessage =
                error.response?.data?.message ||
                error.response?.message ||
                error.message ||
                "Balance enquiry failed";

            console.error("Balance enquiry Error:", errorMessage);

            throw new Error(errorMessage);
        }
    }

    async fundTransfer(data, token) {
        try {
            const response = await axios.post(
                eazyPayConfig.fund_transfer,
                data,
                {
                    headers: {
                        "Content-Type": 'application/json',
                        "Authorization": `Bearer ${token}`
                    }
                }
            )
            return response.data
        } catch (error) {
            const errorMessage =
                error.response?.data?.message ||
                error.response?.message ||
                error.message ||
                "Fund transfer failed";

            console.error("Fund transfer Error:", errorMessage);

            throw new Error(errorMessage);
        }
    }

    async nameEnquiry(data, token) {
        console.log('here')
        try {
            const response = await axios.post(
                eazyPayConfig.name_enquiry,
                data,
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    }
                }
            );
            return response.data;
        } catch (error) {
            const errorMessage =
                error.response?.data?.message ||
                error.response?.message ||
                error.message ||
                "Name enquiry failed";

            console.error("Name Enquiry Error:", errorMessage);

            throw new Error(errorMessage);
        }
    }


    async tsq(data) {
        const token = ''
        try {
            const response = await axios.post(
                eazyPayConfig.tsq,
                data,
                {
                    headers: {
                        "Content-Type": 'application/json',
                        "Authorization": `${token}`
                    }
                }
            )
            return response.data
        } catch (error) {
            throw new Error('Error enquirying name with eazy pay');
        }
    }

}
module.exports = new EazyPayService();