const Usermodel = require("../../model/user.model")
const bcrypt = require("bcrypt")
const UpdateSecrete = async (req, res) => {

    try {
        const { secrets, password } = req.body;

        if (secrets.length < 3) {
            return res.status(400).json({
                message: 'Incomplete secret questions',
                status: 'failed',
            });
        }

        const user = await Usermodel.findById(req.user._id);

        if (!user) {
            return res.status(401).json({
                message: 'Unauthorized to perform this action',
                status: 'failed',
            });
        }

        //compare password
        if (!await bcrypt.compare(password, user.password)) {
            return res.status(401).json({
                message: 'Incorrect password',
                status: 'failed',
            });
        }

        user.secretQuestions = secrets;
        await user.save();

        return res.status(200).json({
            message: 'Your secret questions were updated successfully',
            status: 'success',
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: "failed",
        });
    }

}

module.exports = UpdateSecrete