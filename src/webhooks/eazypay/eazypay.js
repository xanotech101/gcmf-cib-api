const InitiateRequest = require("../../model/initiateRequest.model");
const logger = require("../../utils/logger");

const eazypayWebhook = async (req, res) => {
    try {
        const payload = req.body;

        logger.info("📩 Received EazyPay Webhook:", payload);

        const {
            transactionId,
            batchId,
            status,
            nipResponseCode,
            message,
            ...rest
        } = payload;

        if (!transactionId) {
            logger.warn("⚠️ Webhook missing transactionId");
            return res.status(400).json({ error: "Missing transactionId" });
        }

        const reqDoc = await InitiateRequest.findOne({ transactionId });

        if (!reqDoc) {
            logger.warn(`⚠️ Unknown transactionId from webhook: ${transactionId}`);
            return res.status(200).json({ message: "ignored" });
        }

        let finalStatus = "failed";

        if (nipResponseCode === "00" || status === "SUCCESSFUL") {
            finalStatus = "successful";
        } else if (["06", "91", "x06"].includes(nipResponseCode) || status === "PENDING") {
            finalStatus = "pending";
        } else if (status === "NOT_FOUND") {
            finalStatus = "not_found";
        }

        // Skip duplicates
        if (reqDoc.transferStatus === finalStatus) {
            logger.info(`ℹ️ Duplicate webhook ignored for ${transactionId}`);
            return res.status(200).json({ message: "duplicate" });
        }

        // Update DB
        reqDoc.transferStatus = finalStatus;
        reqDoc.meta = {
            webhookReceivedAt: new Date(),
            message,
            nipResponseCode,
            status,
            batchId,
            raw: payload,
            ...rest
        };
        reqDoc.updatedAt = new Date();

        await reqDoc.save();

        logger.info(`✅ Updated ${transactionId} → ${finalStatus}`);

        return res.status(200).json({ success: true });

    } catch (error) {
        logger.error("❌ Webhook error:", error);
        return res.status(500).json({ error: "Server Error" });
    }
};

module.exports = { eazypayWebhook }