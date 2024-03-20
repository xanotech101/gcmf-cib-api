const express = require("express")
const { generateUserToken, getAllThirdPartyOrganizations, getthirdpartyAnalytics, initiateRequest, getAllTransactionByThirdParty } = require("../controller/external/externalcontroller")
const { validateThirdPartyAuthorization } = require("../middleware/auth")
const { getNameEnquiry, bvnEnquiry, IntrabankAccountEnquiry } = require("../controller/bankone/bankDetails")

const externalRoute = express.Router()

externalRoute.post('/requestToken', generateUserToken)
externalRoute.get('/requestNameEnquiry', validateThirdPartyAuthorization, getNameEnquiry)
externalRoute.get('/bvnValidation', validateThirdPartyAuthorization, bvnEnquiry)
externalRoute.get('/getthirdpartyOrganization', getAllThirdPartyOrganizations)
externalRoute.get('/getthirdpartyAnalytics', getAllThirdPartyOrganizations)
externalRoute.get('/thirdpartyAnalytics/:userid', getthirdpartyAnalytics)
externalRoute.post('/intrabankValidation',validateThirdPartyAuthorization, IntrabankAccountEnquiry)
externalRoute.post("/initiate-transfer", validateThirdPartyAuthorization, initiateRequest )
externalRoute.get("/get-transfers", validateThirdPartyAuthorization, getAllTransactionByThirdParty )


module.exports = externalRoute