const { CronJob } = require("cron");


const InitiateRequest = require("../model/initiateRequest.model");
const paystackService = require("../services/paystack.service");
const bankOneService = require("../services/bankOne.service");

// Paystack reconciliation cron
const paystackReconciliationJob = new CronJob("*/1 * * * *", async () => {
    const timestamp = new Date().toLocaleString("en-NG", {
        timeZone: "Africa/Lagos",
    });

    console.log(`🔁 Paystack reconciliation started at ${timestamp}`);

    try {
        // Get pending Paystack transfers
        const pendingTransfers = await InitiateRequest.find({
            provider_type: "paystack",
            transferStatus: InitiateRequest.TRANSFER_STATUS.AWAITING_CONFIRMATION,
            "meta.paystack.data.transfer_code": { $exists: true },
        });

        for (const transaction of pendingTransfers) {
            const transferCode = transaction.meta?.paystack?.data?.transfer_code;

            console.log(`🔍 Verifying transfer ${transaction.transactionReference}`);

            try {
                const statusResponse = await paystackService.verifyPaystackTransfer(
                    transferCode
                );

                // Log the full Paystack response
                console.log("📨 Paystack response:", JSON.stringify(statusResponse, null, 2));

                const paystackStatus = statusResponse?.data?.status;

                // Update transaction
                transaction.meta = {
                    ...transaction.meta,
                    paystack: statusResponse,
                    lastCheckedAt: new Date(),
                };

                if (paystackStatus === "success") {
                    transaction.transferStatus = InitiateRequest.TRANSFER_STATUS.SUCCESSFUL;
                    // -------------------------------
                    // 2️⃣ DEBIT PAYER ACCOUNT
                    // -------------------------------
                    const debitResponse = await bankOneService.debitCustomerAccount({
                        accountNumber: transaction.payerAccountNumber,
                        amount: transaction.amount,
                        authToken: process.env.AUTHTOKEN,
                    });

                    console.log(`🏦 Debit response for ${transaction.payerAccountNumber}:`, debitResponse);

                    if (!debitResponse?.IsSuccessful) {
                        console.error(`❌ BankOne debit failed for ${transaction.payerAccountNumber}`);

                        transaction.meta = {
                            ...transaction.meta,
                            reason: "Paystack successful but BankOne debit failed",
                            payerAccountNumber: transaction.payerAccountNumber,
                            bankOneReference: debitResponse.Reference || null,
                            debitResponse,
                        };
                        await transaction.save();
                        continue;
                    }

                    console.log(`✅ Debit successful for ${transaction.payerAccountNumber}`);
                } else if (paystackStatus === "failed" || paystackStatus === "reversed") {
                    transaction.transferStatus = InitiateRequest.TRANSFER_STATUS.FAILED;
                } else {
                    transaction.transferStatus = InitiateRequest.TRANSFER_STATUS.AWAITING_CONFIRMATION;
                }

                await transaction.save();
                console.log(`✅ Updated status: ${transaction.transferStatus}`);
            } catch (err) {
                console.error(`⚠️ Failed verifying ${transaction.transactionReference}`, err);
            }
        }

        console.log("🎉 Paystack reconciliation completed");
    } catch (error) {
        console.error("💥 Cron job fatal error", error);
    }
});


// Start the cron job
paystackReconciliationJob.start();

module.exports = { paystackReconciliationJob };
