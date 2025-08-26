const config = require("../config/bankone");
const axios = require("axios");
const axiosRetry = require("axios-retry").default;
const http = require("http");
const https = require("https");
const Bottleneck = require("bottleneck");
const CircuitBreaker = require("opossum");
const logger = require("../utils/logger");

const api = axios.create({
  timeout: 5000,
  httpAgent: new http.Agent({ keepAlive: true, maxSockets: 50 }),
  httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 50 }),
  validateStatus: (status) => status >= 200 && status < 500,
});

axiosRetry(api, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (err) =>
    axiosRetry.isNetworkOrIdempotentRequestError(err) ||
    err.response?.status >= 500,
});

const limiter = new Bottleneck({
  maxConcurrent: 5,
  minTime: 100,
});

const breakerOptions = {
  timeout: 6000,
  errorThresholdPercentage: 50,
  resetTimeout: 10000,
};

function withBreaker(fn) {
  const breaker = new CircuitBreaker(fn, breakerOptions);

  breaker.fallback(() => {
    return { error: true, message: "Service unavailable (circuit breaker open)" };
  });

  breaker.on("open", () => console.warn("⚠️ Circuit breaker OPEN"));
  breaker.on("halfOpen", () => console.info("🔄 Circuit breaker HALF-OPEN"));
  breaker.on("close", () => console.info("✅ Circuit breaker CLOSED"));

  return breaker.fire.bind(breaker);
}

class BankOneService {
  async accountByAccountNo(accountNo, authToken) {
    try {
      const { data } = await axios.get(
        `${config.getAccountByAccountNo}?authtoken=${authToken}&accountNumber=${accountNo}&computewithdrawableBalance=true`
      );
      return data;
    } catch (error) {
      console.log("service", error.response.data);
      throw error.response.data;
    }
  }

  async accountByAccountNoV2(accountNo, authToken) {
    try {
      const { data } = await axios.get(
        `${config.getAccountByAccountNoV2}?authtoken=${authToken}&accountNumber=${accountNo}`
      );
      return data;
    } catch (error) {
      throw error.response.data;
    }
  }

  async BulkOnboardingaccountByAccountNo(accountNo, authToken) {
    try {
      const { data } = await axios.get(
        `${config.getAccountByAccountNoV2}?authtoken=${authToken}&accountNumber=${accountNo}`
      );
      return data;
    } catch (error) {
      console.log(error.response.data);
    }
  }

  async accountByCustomerID(customerId, authToken) {
    try {
      const { data } = await axios.get(
        `${config.getAccountByCustomerID}?authtoken=${authToken}&customerId=${customerId}`
      );
      return data;
    } catch (error) {
      console.log("service", error.response.data);
      throw error.response.data;
    }
  }

  async transactionHistory(params) {
    try {
      const { data } = await axios.get(config.transactionHistory, {
        params,
      });
      return data;
    } catch (error) {
      console.log("service", error.response.data);
      throw error.response.data;
    }
  }

  getAccountDetails = withBreaker(
    async (authToken, accountNumber, bankCode) => {
      try {
        const { data } = await limiter.schedule(() =>
          api.post(config.nameEnquiry, {
            AccountNumber: accountNumber,
            BankCode: bankCode,
            Token: authToken,
          })
        );
        return data;
      } catch (error) {
        console.error("getAccountDetails error", {
          status: error.response?.status,
          message: error.message,
        });
        throw error.response?.data || { message: "Service unavailable" };
      }
    }
  );

  getNameEnquiry = withBreaker(async (authToken, accountNumber, bankCode) => {
    try {
      const { data } = await limiter.schedule(() =>
        api.post(config.nameEnquiry, {
          AccountNumber: accountNumber,
          BankCode: bankCode,
          Token: authToken,
        })
      );
      return data;
    } catch (error) {
      console.error("getNameEnquiry error", {
        status: error.response?.status,
        message: error.message,
      });
      throw error.response?.data || { message: "Service unavailable" };
    }
  });

  getBVNEnquiry = withBreaker(async (authToken, bvn) => {
    try {
      const { data } = await limiter.schedule(() =>
        api.post(config.bvnEnquiry, {
          BVN: bvn,
          Token: authToken,
        })
      );
      return data;
    } catch (error) {
      console.error("getBVNEnquiry error", {
        status: error.response?.status,
        message: error.message,
      });
      throw error.response?.data || { message: "Service unavailable" };
    }
  });

  async getbankDetails(authToken, accountNumber) {
    try {
      const { data } = await axios.post(`${config.getAccountByAccountNo}`, {
        AccountNumber: accountNumber,
        Token: authToken,
      });
      return data;
    } catch (error) {
      console.log("service", error.response.data);
      throw error.response.data;
    }
  }

  async accountStatement(authToken, accountNumber, fromDate, toDate, isPdf) {
    try {
      const { data } = await axios.get(
        `${config.accountStatement}?authtoken=${authToken}&accountNumber=${accountNumber}&fromDate=${fromDate}&toDate=${toDate}&isPdf=${isPdf}`
      );
      return data;
    } catch (error) {
      // return null;
      console.log("service", error.response.data);
      throw error.response.data;
    }
  }

  async doInterBankTransfer(payload) {
    try {
      const { data } = await axios.post(`${config.interbankTransfer}`, payload);
      return data;
    } catch (error) {
      logger.error({ err: error }, "Error in doInterBankTransfer");
      throw error.response.data;
    }
  }

  async doIntraBankTransfer(payload) {
    try {
      const { data } = await axios.post(`${config.intrabankTransfer}`, payload);
      return data;
    } catch (error) {
      logger.error({ err: error }, "Error in doIntraBankTransfer");
      throw error.response.data;
    }
  }

  async getTransactionsPaginated(
    authtoken,
    accountNumber,
    fromDate,
    toDate,
    institutionCode,
    pageNo,
    PageSize
  ) {
    try {
      const { data } = await axios.get(config.nameEnquiry, {
        params: {
          authtoken,
          accountNumber,
          fromDate,
          toDate,
          institutionCode,
          pageNo,
          PageSize,
        },
      });
      return data;
    } catch (error) {
      logger.error({ err: error }, "Error in getTransactionsPaginated");
      throw error.response.data;
    }
  }

  async getAccountInfo(authtoken, accountNumber, institutionCode) {
    try {
      const { data } = await axios.get(config.getAccountInfo, {
        params: {
          authtoken,
          accountNumber,
          institutionCode,
        },
      });
      return data;
    } catch (error) {
      logger.error({ err: error }, "Error in getAccountInfo");
      throw error.response.data;
    }
  }

  async transactionStatus(
    RetrievalReference,
    TransactionDate,
    TransactionType,
    Amount,
    Token
  ) {
    try {
      const { data } = await axios.post(`${config.transactionStatus}`, {
        RetrievalReference,
        TransactionDate,
        TransactionType,
        Amount,
        Token,
      });
      return data;
    } catch (error) {
      console.log("service", error.response.data);
      throw error.response.data;
    }
  }

  async getbankSumaryDetails(authToken, accountNumber) {
    try {
      const { data } = await axios.get(
        `${config.getAccountInfo}?authtoken=${authToken}&accountNumber=${accountNumber}`
      );
      return data;
    } catch (error) {
      console.log("service", error.response.data);
      throw error.response.data;
    }
  }

  async IntrabankAccountEnquiry(authToken, accountNumber) {
    try {
      const { data } = await axios.post(`${config.intraBankAccountEnquiry}`, {
        AccountNo: accountNumber,
        AuthenticationCode: authToken,
      });
      return data;
    } catch (error) {
      console.log("service", error.response.data);
      throw error.response.data;
    }
  }
}






module.exports = new BankOneService();
