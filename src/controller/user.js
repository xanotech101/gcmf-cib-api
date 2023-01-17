const User = require("../model/user");

//@desc     register a user
//@route    POST /users/register
//@access   Public
const registerUser = async(req, res) => {
    const { firstName, lastName, email, designation, phone, gender, organizationId, image, privilege } = req.body
    
    const userExits = await User.findOne({ email });

    if (userExits) {
        res.status(400)
        throw new Error('User already exists')
    }

    //Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    
    
};

module.exports = registerUser;