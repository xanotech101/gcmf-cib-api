const eazypayService = require("../../services/eazypay.service");

const bulkTransfers = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                status: "Failed",
                message: "Authorization token missing or malformed",
            });
        }

        const authToken = authHeader.split(" ")[1];

        const transferRequest = await eazypayService.bulkTransfers(req.body, authToken);

        return res.status(200).json({
            status: "Success",
            message: "Bulk transfer initiated successfully",
            data: transferRequest,
        });
    } catch (error) {
        return res.status(500).json({
            status: "Failed",
            message: error.message || "Something went wrong",
        });
    }
};

const balanceEnquiry = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                status: "Failed",
                message: "Authorization token missing or malformed",
            });
        }

        const authToken = authHeader.split(" ")[1];

        const balance_enquiry = await eazypayService.balanceEnquiry(req.body, authToken);

        return res.status(200).json({
            status: "Success",
            message: "Balance enquiry retrieved successfully",
            data: balance_enquiry,
        });
    } catch (error) {
        return res.status(500).json({
            status: "Failed",
            message: error.message || "Something went wrong",
        });
    }
};

const fundTransfer = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                status: "Failed",
                message: "Authorization token missing or malformed",
            });
        }

        const authToken = authHeader.split(" ")[1];

        const fund_transfer = await eazypayService.fundTransfer(req.body, authToken);

        return res.status(200).json({
            status: "Success",
            message: "Fund transfer initiated successfully",
            data: fund_transfer,
        });
    } catch (error) {
        return res.status(500).json({
            status: "Failed",
            message: error.message || "Something went wrong",
        });
    }
};

const nameEnquiry = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                status: "Failed",
                message: "Authorization token missing or malformed",
            });
        }

        const authToken = authHeader.split(" ")[1];
        const name_enquiry = await eazypayService.nameEnquiry(req.body, authToken);

        return res.status(200).json({
            status: "Success",
            message: "Name enquiry retrieved successfully",
            data: name_enquiry,
        });
    } catch (error) {
        return res.status(500).json({
            status: "Failed",
            message: error.message || "Something went wrong",
        });
    }
};



module.exports = { bulkTransfers, balanceEnquiry, fundTransfer, nameEnquiry };
