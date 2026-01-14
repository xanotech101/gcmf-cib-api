const eazypayService = require("../services/eazypay.service")


// const resetToken = async (req, res) => {
//     const response = await eazypayService.resetToken()

//     if (!response)

//         return res.status(200).send({
//             message: 'reset token fectched successfully',
//             data: response
//         })
// }

const resetToken = async (req, res) => {
    try {
        const response = await eazypayService.resetToken();

        return res.status(200).send({
            message: "reset token fetched successfully",
            data: response,
        });
    } catch (err) {
        return res.status(err.status || 500).send({
            message: "reset token failed",
            provider: err.provider,
            error: err.data?.error,
            reason: err.data?.error_description,
            trace_id: err.data?.trace_id,
            correlation_id: err.data?.correlation_id,
            raw: err.data, // 🔥 full provider payload
        });
    }
};



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