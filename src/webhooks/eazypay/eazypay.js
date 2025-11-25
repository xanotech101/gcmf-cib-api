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
        } = payload;

        if (!transactionId) {
            logger.warn("⚠️ Webhook missing transactionId");
            return res.status(400).json({ error: "Missing transactionId" });
        }
        const reqDoc = await InitiateRequest.findOne({
            "meta.transactionId": transactionId,
            "meta.batchId": batchId,
            provider_type: "eazypay"
        });

        if (!reqDoc) {
            logger.warn(`⚠️ No matching Eazypay request found for transactionId: ${transactionId}`);
            return res.status(200).json({ message: "ignored" });
        }

        let finalStatus = "failed";

        if (nipResponseCode === "00" || status === "SUCCESSFUL") {
            finalStatus = "successful";
        }
        else if (["06", "91", "x06"].includes(nipResponseCode) || status === "PENDING") {
            finalStatus = "pending";
        }
        else if (status === "NOT_FOUND") {
            finalStatus = "not_found";
        }

        if (reqDoc.transferStatus === finalStatus) {
            logger.info(`ℹ️ Duplicate webhook ignored for ${transactionId}`);
            return res.status(200).json({ message: "duplicate" });
        }

        reqDoc.transferStatus = finalStatus;

        reqDoc.meta = {
            ...reqDoc.meta,
            webhookReceivedAt: new Date(),
            webhookMessage: message,
            nipResponseCode,
            transferStatus: status,
        };

        reqDoc.updatedAt = new Date();

        await reqDoc.save();

        logger.info(`✅ Updated Eazypay transaction ${transactionId} → ${finalStatus}`);

        return res.status(200).json({ message: "Webhook received and processed" });

    } catch (error) {
        logger.error("❌ Webhook error:", error);
        return res.status(500).json({ error: "Server Error" });
    }
};


module.exports = { eazypayWebhook }