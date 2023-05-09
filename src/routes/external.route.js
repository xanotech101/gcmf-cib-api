const express = require("express")
const { generateUserToken, getAllThirdPartyOrganizations } = require("../controller/external/externalcontroller")
const { validateThirdPartyAuthorization } = require("../middleware/auth")
const { getNameEnquiry, bvnEnquiry } = require("../controller/bankone/bankDetails")

const externalRoute = express.Router()

externalRoute.post('/requestToken', generateUserToken)
externalRoute.get('/requestNameEnquiry', validateThirdPartyAuthorization, getNameEnquiry)
externalRoute.get('/bvnValidation', validateThirdPartyAuthorization, bvnEnquiry)
externalRoute.get('/getthirdpartyOrganization', getAllThirdPartyOrganizations)


module.exports = externalRoute