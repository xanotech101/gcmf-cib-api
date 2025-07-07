const amqp = require("amqplib");
const { bulkTransferQueueName } = require("../config");
const mongoose = require("mongoose");
const eazyPayService = require("../../eazypay.service"); // Adjust path if needed

const consumeBulkTransferRequest = async () => {
    try {
        const connection = await amqp.connect(
            process.env.RABBIT_MQ_URL || "amqp://localhost"
        );
        const channel = await connection.createChannel();
        await channel.assertQueue(bulkTransferQueueName, { durable: false });

        const unprocessedTransactions = [];
        const successfulTransfers = [];

        channel.consume(
            bulkTransferQueueName,
            async (message) => {
                if (message !== null) {
                    const serializedMessage = message.content.toString();

                    try {
                        const data = JSON.parse(serializedMessage)?.data ?? {};
                        const {
                            transferRequests,
                            batchId,
                            originatingAccountNumber,
                            user,
                        } = data;

                        for (const request of transferRequests) {
                            const transactionId = mongoose.Types.ObjectId().toString().substr(0, 24);

                            const nameEnquiryPayload = {
                                accountNumber: request.destinationAccountNumber,
                                channelCode: "1",
                                destinationInstitutionCode: "999998",
                                transactionId,
                            };

                            let enquiryResponse;
                            try {
                                enquiryResponse = await eazyPayService.nameEnquiry(nameEnquiryPayload);
                            } catch (err) {
                                unprocessedTransactions.push({
                                    ...request,
                                    message: "Name enquiry failed: " + err.message,
                                });
                                continue;
                            }

                            if (enquiryResponse.responseCode !== "00") {
                                unprocessedTransactions.push({
                                    ...request,
                                    message: "Invalid name enquiry response",
                                    rawResponse: enquiryResponse,
                                });
                                continue;
                            }

                            const fundTransferPayload = {
                                amount: Number(request.amount).toFixed(2),
                                beneficiaryAccountName: enquiryResponse.accountName,
                                beneficiaryAccountNumber: request.destinationAccountNumber,
                                beneficiaryBankVerificationNumber: enquiryResponse.bankVerificationNumber,
                                beneficiaryKYCLevel: enquiryResponse.kycLevel || "1",
                                channelCode: enquiryResponse.channelCode || "1",
                                originatorAccountName: request.originatorAccountName || "Default Originator",
                                originatorAccountNumber: request.originatorAccountNumber,
                                originatorKYCLevel: "1",
                                mandateReferenceNumber: `MA-${request.destinationAccountNumber}-${Date.now()}`,
                                paymentReference: `${batchId}/${transactionId}`,
                                transactionLocation: "1.38716,3.05117",
                                originatorNarration: `Payment from ${request.originatorAccountNumber} to ${request.destinationAccountNumber}`,
                                beneficiaryNarration: `Payment to ${request.destinationAccountNumber} from ${request.originatorAccountNumber}`,
                                billerId: process.env.EAZYPAY_BILLER_ID,
                                destinationInstitutionCode: enquiryResponse.destinationInstitutionCode,
                                sourceInstitutionCode: "999998",
                                transactionId: enquiryResponse.transactionId,
                                originatorBankVerificationNumber: request.originatorBVN || "33333333333",
                                nameEnquiryRef: enquiryResponse.sessionID,
                                InitiatorAccountName: request.originatorAccountName || "Default Initiator",
                                InitiatorAccountNumber: request.originatorAccountNumber,
                            };

                            try {
                                const transferResponse = await eazyPayService.fundTransfer(fundTransferPayload);

                                if (transferResponse.responseCode === "00") {
                                    successfulTransfers.push({
                                        ...request,
                                        transactionId,
                                        response: transferResponse,
                                    });
                                } else {
                                    unprocessedTransactions.push({
                                        ...request,
                                        transactionId,
                                        message: "Transfer failed: " + transferResponse.responseMessage,
                                    });
                                }
                            } catch (err) {
                                unprocessedTransactions.push({
                                    ...request,
                                    message: "Transfer error: " + err.message,
                                });
                            }
                        }

                        console.log("✅ Successful Transfers:", successfulTransfers.length);
                        console.log("❌ Unprocessed Transactions:", unprocessedTransactions.length);

                        channel.ack(message);
                    } catch (error) {
                        console.error("❌ Error processing message:", error);
                        channel.nack(message, false, false); // Don't requeue
                    }
                }
            },
            { noAck: false }
        );

        console.log("🟢 Waiting for bulk transfer messages...");
    } catch (error) {
        console.error("❌ Consumer setup error:", error);
    }
};

module.exports = { consumeBulkTransferRequest };
