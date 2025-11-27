const eazyPayConfig = {
    batch_open: `${process.env.MULIPAY_URL}/v1/api/batch/open`,
    add_itme_to_batch: `${process.env.MULIPAY_URL}/v1/api/batch/add`,
    close_batch: `${process.env.MULIPAY_URL}/v1/api/batch/close`,
    submit_batch: `${process.env.MULIPAY_URL}/v1/api/batch`,
    transfer_status: `${process.env.MULIPAY_URL}/v1/api/batch/summary`,
    transaction_details: `${process.env.MULIPAY_URL}/v1/api/transaction/details`,
    reset_token: `${process.env.MULIPAY_RESET_URL}`
};

module.exports = eazyPayConfig;