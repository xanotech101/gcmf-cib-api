const express = require("express")
const { generateUserToken, getAllThirdPartyOrganizations, getthirdpartyAnalytics, initiateRequest, getAllTransactionByThirdParty, createExternalOrganization, updateOrganizationKey } = require("../controller/external/externalcontroller")
const { validateThirdPartyAuthorization, superUserAuth, recordRequestCount } = require("../middleware/auth")
const { getNameEnquiry, bvnEnquiry, IntrabankAccountEnquiry, getTransactionHistory } = require("../controller/bankone/bankDetails")

const externalRoute = express.Router()

externalRoute.post('/createExternalOrganization', createExternalOrganization)
externalRoute.post('/requestToken', generateUserToken)
externalRoute.patch('/update_key', superUserAuth, updateOrganizationKey)
externalRoute.get('/requestNameEnquiry', validateThirdPartyAuthorization, recordRequestCount, getNameEnquiry)
externalRoute.get('/bvnValidation', validateThirdPartyAuthorization, recordRequestCount, bvnEnquiry)
externalRoute.get('/getthirdpartyOrganization', getAllThirdPartyOrganizations)
externalRoute.get('/getthirdpartyAnalytics', getAllThirdPartyOrganizations)
externalRoute.get('/thirdpartyAnalytics/:userid', getthirdpartyAnalytics)
externalRoute.post('/intrabankValidation',validateThirdPartyAuthorization, recordRequestCount, IntrabankAccountEnquiry)
externalRoute.post("/initiate-transfer", validateThirdPartyAuthorization, recordRequestCount, initiateRequest )
externalRoute.get("/get-transfers", validateThirdPartyAuthorization, getAllTransactionByThirdParty )
externalRoute.get("/history/:accountNo", validateThirdPartyAuthorization, getTransactionHistory);


module.exports = externalRoute