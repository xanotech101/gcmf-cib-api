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

const eazyPayService = EazyPayService;

const authToken = process.env.EAZYPAY_TOKEN;
const debitAccountNumber = process.env.EAZYPAY_DEBIT_ACCOUNT;
const debitBankCode = process.env.EAZYPAY_DEBIT_BANK_CODE;

async function eazypayProcessor(data) {
    try {
        console.log("🚀 Starting eazypayProcessor...");
        console.log("📦 Incoming data:", JSON.stringify(data, null, 2));

        const { transferRequests } = data;

        console.log(`📝 Number of transfer requests: ${transferRequests.length}`);

        const totalAmount = transferRequests.reduce(
            (sum, t) => sum + Number(t.amount),
            0
        );

        const itemCount = transferRequests.length;

        console.log(`💰 Total amount: ${totalAmount}`);
        console.log(`🔢 Item count: ${itemCount}`);

        const batchId = generateBatchId();
        console.log(`🆕 Generated batchId: ${batchId}`);

        // Build items
        console.log("🛠️ Building batch items...");
        const items = transferRequests.map(req => {
            const transactionId = generateTransactionId("PAY");

            console.log(
                `🆕 Item created → transactionId: ${transactionId}, account: ${req.destinationAccountNumber}`
            );

            return {
                transactionId,
                accountName: req.accountName,
                accountNumber: req.destinationAccountNumber,
                bankCode: req.destinationBankCode,
                amount: Number(req.amount),
                narration: req.narration || "Bulk Payment",
                _id: req._id,
            };
        });

        // Build payload
        const submitPayload = {
            batchId,
            totalAmount,
            itemCount,
            debitAccountNumber,
            debitBankCode,
            debitNarration: `Bulk transfer initiated for GMFB`,
            items,
        };

        console.log("📨 Final submitPayload:");
        console.log(JSON.stringify(submitPayload, null, 2));

        // Submit batch
        console.log("📤 Submitting batch to EazyPay...");
        const submitResult = await eazyPayService.submitBatch(submitPayload, authToken);

        console.log("✅ Batch submitted successfully!");
        console.log("📥 submitResult:", JSON.stringify(submitResult, null, 2));

        // Update DB
        console.log("🗃️ Updating DB records as pending...");
        for (const item of items) {
            console.log(`🔍 Looking for DB record with _id: ${item._id}`);

            const reqDoc = await InitiateRequest.findById(item._id);

            if (!reqDoc) {
                console.log(`⚠️ No DB record found for ${item._id}, skipping...`);
                continue;
            }

            reqDoc.transferStatus = "pending";
            reqDoc.transactionId = item.transactionId;
            reqDoc.batchId = batchId;
            reqDoc.updatedAt = new Date();

            await reqDoc.save();

            console.log(`📌 Updated ${item._id} → status: pending`);
        }

        console.log("🎉 Bulk processing completed successfully!");

        return {
            batchId,
            submitResult,
        };

    } catch (error) {
        console.error("❌ Error processing bulk transfer:", error);
        throw error;
    }
}




module.exports = { eazypayProcessor };
