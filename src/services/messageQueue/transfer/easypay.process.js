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

let cachedToken = null;
let tokenExpiry = 0;

async function getToken() {
    const now = Date.now();

    if (cachedToken && now < tokenExpiry) {
        return cachedToken;
    }

    const newToken = await eazyPayService.resetToken();
    const expiresInMs = 2 * 60 * 60 * 1000;
    cachedToken = newToken;
    tokenExpiry = now + expiresInMs;

    return cachedToken;
}

const eazyPayService = EazyPayService;

const debitAccountNumber = process.env.EAZYPAY_DEBIT_ACCOUNT;
const debitBankCode = process.env.EAZYPAY_DEBIT_BANK_CODE;

async function eazypayProcessor(data) {
    try {
        const transferRequests = JSON.parse(data);

        if (!Array.isArray(transferRequests) || transferRequests.length === 0) {
            throw new Error("No transfer requests provided.");
        }

        const totalAmount = transferRequests.reduce(
            (sum, t) => sum + Number(t.amount || 0),
            0
        );
        const itemCount = transferRequests.length;

        const batchId = generateBatchId();

        const items = transferRequests.map(req => {
            const transactionId = generateTransactionId("PAY");

            return {
                transactionId,
                accountName: req.accountName,
                accountNumber: req.accountNumber,
                bankCode: req.bankCode,
                amount: Number(req.amount || 0),
                narration: "Transfer request",
                _id: req.transactionId
            };
        });
        const paymentItems = items.map(({ _id, ...clean }) => clean);

        const submitPayload = {
            batchId,
            totalAmount,
            itemCount,
            debitAccountNumber,
            debitBankCode,
            debitNarration: `Bulk transfer initiated for GMFB`,
            paymentItems,
        };

        const authToken = await getToken();

        const submitResult = await eazyPayService.submitBatch(submitPayload, authToken);

        for (const item of items) {
            if (!item._id) {
                continue;
            }
            const reqDoc = await InitiateRequest.findById(item._id);
            if (!reqDoc) {
                continue;
            }

            reqDoc.meta = {
                transactionId: item.transactionId,
                batchId: batchId,
                transferStatus: "pending",
            };

            reqDoc.provider_type = "eazypay";

            await reqDoc.save();
        }

        console.log("🎉 Bulk processing completed successfully!");

        return {
            batchId,
            submitResult,
        };

    } catch (error) {
        console.log("❌ Error processing bulk transfer:", error);
        throw error;
    }
}





module.exports = { eazypayProcessor };
