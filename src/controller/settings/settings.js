const Usermodel = require("../../model/user.model")
const UpdateSecrete = async (req, res) => {

    try {
        const {questions} = req.body

        if (questions.length < 1 || questions.length < 3){
            return res.status(400).send({
                message:'incomplete secrete questions',
                status: "failed",
            })
        }

        const check_user = await Usermodel.findOne({_id:req.user._id})
        if(!check_user){
            return res.status(401).send({
                message:'unAuthorize to perform this action',
                status: "failed",
            })
        }

        const request_update = await Usermodel.updateOne({_id:req.user._id}, {$set:{secretQuestions:questions}})
        if(!request_update){
            return res.status(500).json({
                message: 'there was an error updating your secrete information',
                status: "failed",
            });
        }
        return res.status(200).json({
            message: "your secrete was updated successfully",
            status: "Success",
        });

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: error.message,
            status: "failed",
        });
    }

}

module.exports = UpdateSecrete