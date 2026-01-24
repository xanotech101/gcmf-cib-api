const EazyPayService = require("../../eazypay.service");
const InitiateRequest = require("../../../model/initiateRequest.model");
const logger = require("../../../utils/logger");
const bankOneService = require("../../bankOne.service");
const { TRANSFER_STATUS, APPROVAL_STATUS } = require("../../../model/initiateRequest.model");

function generateBatchId() {
    const prefix = "AE458361787634223232381";
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${random}`;
}

function generateTransactionId(prefix = "TXN") {
    const random = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}${random}`;
}

function getTransferStatus(status, responseCode, bankOneResponse) {

    if ((responseCode === "00") ||
        bankOneResponse === "SuccessfulButFeeNotTaken") {
        return "approved";
    }

    if (
        bankOneResponse === "Pending" ||
        ["06", "91", "X06", "08", "09"].includes(responseCode)
    ) {
        return "in progress";
    }

    if (bankOneResponse === "Reversed" || responseCode === "06") {
        return "reversed";
    }

    return "declined";
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
        console.log("📥 Queue job received");

        const transferRequests = JSON.parse(data);

        if (!Array.isArray(transferRequests) || transferRequests.length === 0) {
            console.warn("⚠️ No transfer requests provided");
            return;
        }

        const batchId = generateBatchId();
        console.log(`🧾 Batch initialized: ${batchId}`);

        // ---------------------------------------
        // 1️⃣ PREPARE ITEMS
        // ---------------------------------------
        const items = transferRequests.map((req) => {
            const transactionId = generateTransactionId("PAY");

            return {
                transactionId,
                payerAccountNumber: req.payerAccountNumber,
                accountName: req.accountName,
                accountNumber: req.accountNumber,
                bankCode: req.bankCode,
                amount: Number(req.amount || 0),
                narration: "Transfer request",
                _id: req.transactionId,
                type: req.type, // 👈 needed for intra-bank check
            };
        });

        console.log(`📦 Total transfer items received: ${items.length}`);

        // ---------------------------------------
        // 2️⃣ GET TOKENS
        // ---------------------------------------
        console.log("🔐 Fetching tokens...");
        const authToken = await getToken();
        const bankOneToken = process.env.AUTHTOKEN;
        console.log("✅ Tokens retrieved");

        const eligibleItems = [];

        // ---------------------------------------
        // 3️⃣ PROCESS PAYERS (BALANCE + DEBIT)
        // ---------------------------------------
        for (const item of items) {
            console.log(
                `➡️ Processing payer ${item.payerAccountNumber} | Amount: ${item.amount}`
            );

            const reqDoc = item._id
                ? await InitiateRequest.findById(item._id)
                : null;

            try {
                // =====================================================
                // 🏦 INTRA-BANK TRANSFER (BANKONE ONLY)
                // =====================================================
                if (item.type === "intra-bank") {
                    console.log(
                        `🏦 Processing intra-bank transfer for ${item.payerAccountNumber}`
                    );

                    const intraBankPayload = {
                        Amount: item.amount * 100,
                        RetrievalReference: item.transactionId,
                        FromAccountNumber: item.payerAccountNumber,
                        ToAccountNumber: item.accountNumber,
                        AuthenticationKey: bankOneToken,
                        Narration: item.narration,
                    };

                    const result =
                        await bankOneService.doIntraBankTransfer(
                            intraBankPayload
                        );

                    console.log("🏦 Intra-bank response:", result);

                    // if (result?.IsSuccessful === false || result?.IsSuccessFul === false) {
                    //     if (reqDoc) {
                    //         reqDoc.transferStatus =
                    //             TRANSFER_STATUS.AWAITING_CONFIRMATION;
                    //         reqDoc.provider_type = "bankone";
                    //         reqDoc.meta = {
                    //             reason: "Intra-bank transfer pending",
                    //             bankOneResponse: result,
                    //         };
                    //         await reqDoc.save();
                    //     }
                    //     continue;
                    // }

                    const transferStatus = getTransferStatus(
                        result.IsSuccessful,
                        result.ResponseCode,
                        result.Status
                    );

                    if (reqDoc) {
                        reqDoc.status = APPROVAL_STATUS.APPROVED;
                        reqDoc.transferStatus =
                            transferStatus === "approved"
                                ? InitiateRequest.TRANSFER_STATUS.SUCCESSFUL : transferStatus === 'reversed' ? TRANSFER_STATUS.REVERSED
                                    : TRANSFER_STATUS.FAILED;
                        reqDoc.provider_type = "bankone";
                        reqDoc.meta = {
                            bankOneResponse: result,
                        };
                        await reqDoc.save();
                    }

                    continue; // 🚨 VERY IMPORTANT: do not go to eazypay
                }

                // =====================================================
                // 🌍 INTER-BANK (EXISTING FLOW UNCHANGED)
                // =====================================================

                // 🔍 CHECK BALANCE
                console.log(
                    `🔍 Checking balance for ${item.payerAccountNumber}`
                );

                const accountResponse =
                    await bankOneService.accountByAccountNo(
                        item.payerAccountNumber,
                        bankOneToken
                    );

                console.log(
                    `💰 Balance response for ${item.payerAccountNumber}:`,
                    accountResponse
                );

                if (!accountResponse?.WithdrawableBalance) {
                    throw new Error("Withdrawable balance not returned");
                }

                const withdrawableBalance = Number(
                    accountResponse.WithdrawableBalance.replace(/,/g, "")
                );

                console.log(
                    `💳 Withdrawable balance: ${withdrawableBalance}`
                );

                if (withdrawableBalance < item.amount) {
                    console.warn(
                        `❌ Insufficient funds | ${item.payerAccountNumber}`
                    );

                    if (reqDoc) {
                        reqDoc.transferStatus = "failed";
                        reqDoc.meta = {
                            reason: "Insufficient funds",
                            payerAccountNumber: item.payerAccountNumber,
                            withdrawableBalance,
                        };
                        await reqDoc.save();
                    }
                    continue;
                }

                // 💳 DEBIT PAYER ACCOUNT
                console.log(
                    `💸 Debiting ${item.amount} from ${item.payerAccountNumber}`
                );

                const debitResponse =
                    await bankOneService.debitCustomerAccount({
                        accountNumber: item.payerAccountNumber,
                        amount: item.amount,
                        authToken: bankOneToken,
                    });

                console.log(
                    `🏦 Debit response for ${item.payerAccountNumber}:`,
                    debitResponse
                );

                if (!debitResponse?.IsSuccessful) {
                    console.error(
                        `❌ Debit failed for ${item.payerAccountNumber}`
                    );

                    if (reqDoc) {
                        reqDoc.transferStatus = "failed";
                        reqDoc.meta = {
                            reason: "BankOne debit failed",
                            payerAccountNumber: item.payerAccountNumber,
                            debitResponse,
                        };
                        await reqDoc.save();
                    }
                    continue;
                }

                // ✅ SUCCESSFUL DEBIT
                console.log(
                    `✅ Debit successful for ${item.payerAccountNumber}`
                );

                if (reqDoc) {
                    reqDoc.transferStatus = "processing";
                    reqDoc.meta = {
                        payerAccountNumber: item.payerAccountNumber,
                        debitedAmount: item.amount,
                        bankOneReference: debitResponse.Reference || null,
                    };
                    await reqDoc.save();
                }

                eligibleItems.push(item);
            } catch (err) {
                console.error(
                    `🔥 Error processing payer ${item.payerAccountNumber}`,
                    err
                );

                if (reqDoc) {
                    reqDoc.transferStatus = "failed";
                    reqDoc.meta = {
                        reason: err.message,
                        payerAccountNumber: item.payerAccountNumber,
                    };
                    await reqDoc.save();
                }
            }
        }

        // ---------------------------------------
        // 4️⃣ CHECK ELIGIBLE TRANSFERS
        // ---------------------------------------
        console.log(
            `📊 Eligible transfers count: ${eligibleItems.length}`
        );

        if (eligibleItems.length === 0) {
            console.warn(
                `⚠️ Batch ${batchId} stopped — no eligible transfers`
            );
            return {
                batchId,
                status: "failed",
                reason: "No eligible transfers",
            };
        }

        // ---------------------------------------
        // 5️⃣ BUILD MULTIPAY PAYLOAD
        // ---------------------------------------
        const totalAmount = eligibleItems.reduce(
            (sum, t) => sum + Number(t.amount || 0),
            0
        );

        console.log(`💵 Total eligible amount: ${totalAmount}`);

        const paymentItems = eligibleItems.map(({ _id, ...clean }) => clean);

        const submitPayload = {
            batchId,
            totalAmount,
            itemCount: eligibleItems.length,
            debitAccountNumber,
            debitBankCode,
            debitNarration: `Bulk transfer initiated for GMFB`,
            paymentItems,
        };

        console.log(
            `🚀 Sending batch ${batchId} to MultiPay`,
            submitPayload
        );

        // ---------------------------------------
        // 6️⃣ SEND TO MULTIPAY / EAZYPAY
        // ---------------------------------------
        const submitResult = await eazyPayService.submitBatch(
            submitPayload,
            authToken
        );

        console.log(
            `📨 MultiPay response for batch ${batchId}:`,
            submitResult
        );

        // ---------------------------------------
        // 7️⃣ UPDATE ELIGIBLE RECORDS → PENDING
        // ---------------------------------------
        for (const item of eligibleItems) {
            if (!item._id) continue;

            const reqDoc = await InitiateRequest.findById(item._id);
            if (!reqDoc) continue;

            reqDoc.provider_type = "eazypay";
            reqDoc.meta = {
                transactionId: item.transactionId,
                batchId,
                transferStatus: "pending",
            };

            await reqDoc.save();
        }

        console.log(`🎉 Batch ${batchId} completed successfully`);

        return {
            batchId,
            submitResult,
        };
    } catch (error) {
        console.error(
            "💥 Fatal error in eazypayProcessor",
            error
        );
    }
}




module.exports = { eazypayProcessor };
