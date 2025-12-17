// register api endpoints here

const config = {
  secret_key: process.env.PAYSTACK_SECRET,
  bank_list: "https://api.paystack.co/bank",
  resolve_account: "https://api.paystack.co/bank/resolve",
  create_transfer_receipient: "https://api.paystack.co/transferrecipient",
  bulk_transfer: "https://api.paystack.co/transfer/bulk",
  transfer_status: "https://api.paystack.co/transfer",

}

module.exports = config;