const eazyPayConfig = {
    // secret_key: process.env.PAYSTACK_SECRET,
    bulk_transfer: "https://apitest.nibss-plc.com.ng/nipbulk/v1/api/batch",
    fund_transfer: "https://apitest.nibss-plc.com.ng/nipservice/v1/nip/fundstransfer",
    name_enquiry: "https://apitest.nibss-plc.com.ng/nipservice/v1/nip/nameenquiry",
    balance_enquiry: "https://apitest.nibss-plc.com.ng/nipservice/v1/nip/balanceenquiry",
    tsq: "https://apitest.nibss-plc.com.ng/nipservice/v1/nip/tsq"
};

module.exports = eazyPayConfig;