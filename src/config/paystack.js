// register api endpoints here

const config = {
  secret_key: process.env.PAYSTACK_SECRET,
  bank_list: "https://api.paystack.co/bank",
  resolve_account: "https://api.paystack.co/bank/resolve",
  bulk_transfer: "https://api.paystack.co/transfer/bulk",
  create_transfer_receipient: "https://api.paystack.co/transferrecipient",
};

module.exports = config;