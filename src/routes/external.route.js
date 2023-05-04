const express = require("express")
const { generateUserToken } = require("../controller/external/externalcontroller")
const { validateAuthorization } = require("../middleware/auth")
const { getNameEnquiry } = require("../controller/bankone/bankDetails")

const externalRoute = express.Router()

externalRoute.post('/requestToken', generateUserToken)
externalRoute.get('/requestNameEnquiry', validateAuthorization, getNameEnquiry)


module.exports = externalRoute