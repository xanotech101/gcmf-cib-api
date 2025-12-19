const InitiateRequest = require("../../model/initiateRequest.model");
const logger = require("../../utils/logger");

const eazypayWebhook = async (req, res) => {
    try {
        const payload = req.body;

        logger.info("📩 Received EazyPay Webhook", payload);

        const {
            transactionId,
            batchId,
            status: providerStatus,
            nipResponseCode,
            message,
        } = payload;

        if (!transactionId || !batchId) {
            logger.warn("⚠️ Webhook missing transactionId or batchId");
            return res.status(400).json({ error: "Missing identifiers" });
        }

        const reqDoc = await InitiateRequest.findOne({
            "meta.transactionId": transactionId,
            "meta.batchId": batchId,
            provider_type: "eazypay",
        });

        if (!reqDoc) {
            logger.warn(
                `⚠️ No matching transaction for transactionId=${transactionId}, batchId=${batchId}`
            );
            return res.status(200).json({ message: "ignored" });
        }

        // ---------------------------------------
        // 1️⃣ MAP PROVIDER RESPONSE → INTERNAL STATUS
        // ---------------------------------------
        let transferStatus = TRANSFER_STATUS.FAILED;

        if (nipResponseCode === "00" || providerStatus === "SUCCESSFUL") {
            transferStatus = TRANSFER_STATUS.SUCCESSFUL;
        }
        else if (
            ["06", "91", "x06"].includes(nipResponseCode) ||
            providerStatus === "PENDING"
        ) {
            transferStatus = TRANSFER_STATUS.AWAITING_CONFIRMATION;
        }

        logger.info(
            `🔄 Status mapping | provider=${providerStatus}, nip=${nipResponseCode} → transferStatus=${transferStatus}, approvalStatus=${approvalStatus}`
        );

        // ---------------------------------------
        // 2️⃣ IDEMPOTENCY CHECK
        // ---------------------------------------
        if (reqDoc.transferStatus === transferStatus) {
            logger.info(
                `ℹ️ Duplicate webhook ignored for ${transactionId}`
            );
            return res.status(200).json({ message: "duplicate" });
        }

        // ---------------------------------------
        // 3️⃣ UPDATE DOCUMENT
        // ---------------------------------------
        reqDoc.transferStatus = transferStatus;
        reqDoc.status = approvalStatus;

        reqDoc.meta = {
            ...reqDoc.meta,
            webhookReceivedAt: new Date(),
            webhookMessage: message,
            nipResponseCode,
            providerTransferStatus: providerStatus,
        };

        reqDoc.updatedAt = new Date();

        await reqDoc.save();

        logger.info(
            `✅ Transaction ${transactionId} updated → ${transferStatus}`
        );

        return res.status(200).json({
            message: "Webhook processed",
        });
    } catch (error) {
        logger.error("❌ EazyPay webhook error", error);
        return res.status(500).json({ error: "Server Error" });
    }
};



module.exports = { eazypayWebhook }