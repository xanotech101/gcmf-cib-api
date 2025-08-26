const EazyPayService = require("../../eazypay.service");

function generateBatchId() {
    const prefix = "AE458361787634223232381";
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${random}`;
}

function generateTransactionId(prefix = "TXN") {
    const random = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}${random}`;
}


const eazyPayService = EazyPayService

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

        // collect all transactionIds for later
        const transactionIds = [];

        // STEP 2: Add Items
        for (const request of transferRequests) {
            const transactionId = generateTransactionId("PAY");
            transactionIds.push(transactionId);

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
        logger.info("📊 Batch Status:", {
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
        });

        // STEP 6: Get Transaction Details for each item
        const transactionDetails = [];
        for (const tId of transactionIds) {
            const details = await eazyPayService.TransactionDetails(batchId, tId, authToken);
            const logDetails = {
                accountName: details.accountName,
                accountNumber: details.accountNumber,
                amount: details.amount,
                bankCode: details.bankCode,
                batchId: details.batchId,
                message: details.message,
                narration: details.narration,
                nipResponseCode: details.nipResponseCode,
                status: details.status,
                timestamp: details.timestamp,
                transactionId: details.transactionId,
            };
            logger.info("Transaction Details:", logDetails);
            transactionDetails.push(logDetails);
        }

        // Return structured response
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
            transactionDetails,
        };
    } catch (error) {
        logger.error("Error processing bulk transfer:", error);
        throw error;
    }
}

module.exports = { eazypayProcessor };
