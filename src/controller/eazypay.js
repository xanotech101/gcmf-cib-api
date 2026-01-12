const eazypayService = require("../services/eazypay.service")


const resetToken = async (req, res) => {
    const response = await eazypayService.resetToken()

    return res.status(200).send({
        message: 'reset token fectched successfully',
        data: response
    })
}

const openBatch = async (req, res) => {
    const authHeader = req.headers.authorization
    const token = authHeader?.split(' ')[1]

    if (!token) {
        return res.status(401).send({
            message: 'Authorization token is required',
        })
    }

    const response = await eazypayService.openBatch(req.body, token)

    return res.status(200).send({
        message: 'batch open successfully',
        data: response,
    })
}


module.exports = {
    resetToken,
    openBatch
}