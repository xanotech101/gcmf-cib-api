const EazyPayService = require("../../eazypay.service");
const InitiateRequest = require("../../../model/initiateRequest.model");
const logger = require("../../../utils/logger");

function generateBatchId() {
    const prefix = "AE458361787634223232381";
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${random}`;
}

function generateTransactionId(prefix = "TXN") {
    const random = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}${random}`;
}

const eazyPayService = new EazyPayService(); // ✅ fixed instantiation

const authToken = process.env.EAZYPAY_TOKEN;
const debitAccountNumber = process.env.EAZYPAY_DEBIT_ACCOUNT;
const debitBankCode = process.env.EAZYPAY_DEBIT_BANK_CODE;

/**
 * Pure processor: processes bulk transfer data with EazyPay
 */
async function eazypayProcessor(data) {
    try {
        const { transferRequests } = data;

        // calculate totals
        const totalAmount = transferRequests.reduce((sum, t) => sum + Number(t.amount), 0);
        const itemCount = transferRequests.length;

        // STEP 1: Open Batch
        const batchId = generateBatchId();
        const openBatchPayload = {
            batchId,
            totalAmount,
            itemCount,
            debitAccountNumber,
            debitBankCode,
            debitNarration: `Bulk transfer initiated for GMFB`,
        };
        await eazyPayService.openBatch(openBatchPayload, authToken);
        logger.info(`✅ Batch Opened: ${batchId}`);

        // map requestId → transactionId
        const requestMap = {};

        // STEP 2: Add Items
        for (const request of transferRequests) {
            const transactionId = generateTransactionId("PAY");
            requestMap[request._id] = transactionId;

            const itemPayload = {
                accountName: request.accountName,
                accountNumber: request.destinationAccountNumber,
                bankCode: request.destinationBankCode,
                amount: Number(request.amount),
                transactionId,
                narration: request.narration || "Bulk Payment",
            };

            await eazyPayService.addItemToBatch(batchId, [itemPayload], authToken);
            logger.info(`Item Added for ${request.accountName}, TXN: ${transactionId}`);
        }

        // STEP 3: Close Batch
        await eazyPayService.closeBatch(batchId, authToken);
        logger.info(`Batch Closed: ${batchId}`);

        // STEP 4: Submit Batch
        await eazyPayService.submitBatch(
            {
                batchId,
                totalAmount,
                itemCount,
                debitAccountNumber,
                debitBankCode,
                debitNarration: openBatchPayload.debitNarration,
            },
            authToken
        );
        logger.info(`Batch Submitted: ${batchId}`);

        // STEP 5: Get Batch Status
        const status = await eazyPayService.Tsq(batchId, authToken);
        logger.info("Batch Status:", status);

        // STEP 6: Get Transaction Details and update DB
        for (const request of transferRequests) {
            const transactionId = requestMap[request._id];
            const details = await eazyPayService.TransactionDetails(batchId, transactionId, authToken);

            let transferStatus = "failed";
            if (details?.nipResponseCode === "00") {
                transferStatus = "successful";
            } else if (["06", "91", "x06"].includes(details?.nipResponseCode) || details?.status === "Pending") {
                transferStatus = "pending";
            } else if (details?.status === "404") {
                transferStatus = "not_found";
            }

            const reqDoc = await InitiateRequest.findById(request._id);
            if (reqDoc) {
                reqDoc.transferStatus = transferStatus;
                reqDoc.meta = details;
                reqDoc.updatedAt = new Date();
                await reqDoc.save();
                logger.info(`📌 Updated DB for request ${request._id} with status: ${transferStatus}`);
            }
        }

        return {
            batchStatus: {
                batchId: status.batchId,
                failed: status.failed,
                itemCount: status.itemCount,
                message: status.message,
                pending: status.pending,
                processing: status.processing,
                status: status.status,
                successful: status.successful,
                timestamp: status.timestamp,
                totalAmount: status.totalAmount,
            },
        };
    } catch (error) {
        logger.error("Error processing bulk transfer:", error);
        throw error;
    }
}

module.exports = { eazypayProcessor };
