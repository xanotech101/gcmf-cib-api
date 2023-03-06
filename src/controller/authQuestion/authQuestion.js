const AuthQuestions = require("../../model/authQuestions");


const createAuthQuestions = async (req, res) => {
    try {
        const authQuestions = await AuthQuestions.create({
           authQuestions: authQuestions.push(req.body.secreteQuestion)
        });

  
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error.message,
      status: "failed",
    });
  }
};


module.exports = createAuthQuestions;