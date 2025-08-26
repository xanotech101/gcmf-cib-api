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
            debitNarration: `Bulk transfer initiated by for GMFB`,
        };
        const batchOpen = await eazyPayService.openBatch(openBatchPayload, authToken);
        logger.info("✅ Batch Opened:", batchOpen);

        // STEP 2: Add Items
        for (const request of transferRequests) {
            const itemPayload = {
                accountName: request.accountName,
                accountNumber: request.destinationAccountNumber,
                bankCode: request.destinationBankCode,
                amount: Number(request.amount),
                transactionId: generateTransactionId("PAY"),
                narration: request.narration || "Bulk Payment",
            };

            const added = await eazyPayService.addItemToBatch(batchId, [itemPayload], authToken);
            logger.info("Item Added:", added);
        }

        // STEP 3: Close Batch
        const batchClosed = await eazyPayService.closeBatch(batchId, authToken);
        logger.info("Batch Closed:", batchClosed);

        // STEP 4: Submit Batch
        const submitPayload = {
            batchId,
            totalAmount,
            itemCount,
            debitAccountNumber,
            debitBankCode,
            debitNarration: openBatchPayload.debitNarration,
        };
        const submitted = await eazyPayService.submitBatch(submitPayload, authToken);
        logger.info("Batch Submitted:", submitted);

        return submitted;
    } catch (error) {
        logger.error("Error processing bulk transfer:", error);
        throw error;
    }
}
module.exports = { eazypayProcessor };
