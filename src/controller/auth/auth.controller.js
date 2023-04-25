const User = require("../../model/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const secretQuestionService = require("../../services/secretQuestion.service");
const { sendEmail } = require("../../utils/emailService");
const { getDateAndTime } = require("../../utils/utils");
const auditTrailService = require("../../services/auditTrail.service");

const preLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send({
        data: null,
        message: "Invalid email or password",
        status: "failed",
      });
    }

    if (!user.isVerified) {
      return res.status(403).send({
        data: null,
        message: "User is still yet to be verified on the platform",
        status: "failed",
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(400).send({
        data: null,
        message: "Invalid email or password",
        status: "failed",
      });
    }

    if (user.is2FAEnabled) {
      const randomSecretQuestion =
        user.secretQuestions[
        Math.floor(Math.random() * user.secretQuestions.length)
        ];
      //query secretquestion db to get the question
      const secretQuestion = await secretQuestionService.getQuestionById(
        randomSecretQuestion.question
      );

      // send the secret question to the user as response
      return res.status(200).send({
        data: { secretQuestion },
        message: "User is required to answer a secret question",
        status: "success",
      });
    }

    if (!user.is2FAEnabled) {
      return res.status(400).send({
        data: null,
        message: "User has not set up secret questions",
        status: "failed",
      });
    }

    res.status(200).send({
      data: null,
      message: "User has not set up secret questions",
      status: "failed",
    });
  } catch (error) {
    console.log("🚀 ~ file: auth.controller.js:71 ~ preLogin ~ error:", error);
    res.status(500).json({
      status: "failed",
      message: "Unable to login user",
      data: null,
    });
  }
};

const login = async (req, res) => {
  const { email, question, answer } = req.body;
  try {
    const user = await User.findOne({ email });
    const secretQuestion = user.secretQuestions.find((q) => {
      return q.question.toString() === question;
    });

    if (!secretQuestion) {
      return res.status(400).send({
        data: null,
        message: "Invalid question",
        status: "failed",
      });
    }

    const isAnswerCorrect = secretQuestion.answer === answer;

    if (isAnswerCorrect === false) {
      // pick another question for the user
      const randomSecretQuestion =
        user.secretQuestions[
        Math.floor(Math.random() * user.secretQuestions.length)
        ];

      const secretQuestion = await secretQuestionService.getQuestionById(
        randomSecretQuestion.question
      );

      // send the secret question to the user as response
      return res.status(400).send({
        data: secretQuestion,
        message: "Incorrect answer",
        status: "failed",
      });
    }

    const token = await user.generateAuthToken();

    const { date, time } = getDateAndTime();

    await auditTrailService.createAuditTrail({
      user: user._id,
      type: "authentication",
      message: `${user.firstName} logged in on ${date} by ${time}`,
      organization: user.organizationId,
    });

    res.json({
      message: "User Logged in Successfully",
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    console.log("🚀 ~ file: auth.controller.js:136 ~ login ~ error:", error);
    res.status(500).json({
      status: "failed",
      message: "Unable to login user",
      data: null,
    });
  }
};

const forgetPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(400).json({
        message:
          "If the mail you entered is registered on the platform, you will get a mail to change you password",
        data: null,
        status: "failed",
      });
    }

    //Email Details
    const token = jwt.sign(
      { user_email: user.email, user_password: user.password },
      process.env.EMAIL_SECRET,
      {
        expiresIn: "30m",
      }
    );

    const link = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    const subject = "Password Reset Link";

    const messageData = {
      firstName: user.firstName,
      url: link,
      message: `Hello ${user.firstName}  Please follow the link to verify your account ${link}`,
      year: new Date().getFullYear(),
    }
    await sendEmail(user.email, subject, "reset-password", messageData);

    res.status(200).json({
      status: "success",
      message:
        "If the mail you inputed is registered on the platform, you will get a mail to change you password",
      data: null,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "failed",
      Message: "Unable to verify email",
    });
  }
};

const verifyUser = async (req, res) => {
  try {
    const decoded = jwt.verify(req.params.token, process.env.EMAIL_SECRET);
    const { password, secretQuestions } = req.body;
    const mail = decoded;

    if (!mail) {
      res.status(400).json({
        status: "failed",
        Message: "Invalid token",
        data: null,
      });
    }

    const user = await User.findOne({ email: mail.user_email ?? mail.email });

    if (!user) {
      return res.status(400).json({
        status: "failed",
        Message: "User not found",
        data: null,
      });
    }

    const salt = await bcrypt.genSalt(10);

    if (user.isVerified) {
      return res
        .status(400)
        .json({ message: "User is already verified on the platform" });
    }

    if (user.verificationToken == null) {
      return res.status(400).json({ message: "Invalid token" });
    }

    user.isVerified = true;
    user.password = await bcrypt.hash(password, salt);
    user.verificationToken = null;
    user.secretQuestions = secretQuestions;
    user.is2FAEnabled = true;

    await user.save();

    return res.status(200).json({
      message: "User verified successfully",
      data: user,
      status: "success",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "failed",
      Message: "Unable to verify user",
      data: null,
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { password, token } = req.body;

    const decoded = jwt.verify(token, process.env.EMAIL_SECRET);

    let userEmail = decoded.user_email;
    let userPassword = decoded.user_password;

    const user = await User.findOne({ email: userEmail });
    const check_incoming_password = await bcrypt.compare(
      password,
      userPassword
    );
    if (check_incoming_password)
      return res
        .status(400)
        .json({ message: "New password cannot be same as old password" });

    //Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();
    return res.status(200).json({
      status: "success",
      message: "Password changed successfully",
      data: null,
    });
  } catch (error) {
    return res.status(500).json({
      status: "failed",
      data: null,
      message: "Unable to verify user",
    });
  }
};

const registerUser = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const userExits = await User.findOne({ email: req.body.email });

    if (userExits) {
      return res.status(400).send({
        status: "failed",
        data: null,
        message: "User is already registered",
      });
    }

    let role = "user";
    if (req.path === "/super_admin/register") {
      role = "super-admin";
    } else if (req.path === "/admin/register") {
      role = "admin";
    }

    const user = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      gender: req.body.gender,
      organizationId: organizationId,
      imageUrl: req.body.imageUrl,
      privileges: req.body.privileges,
      role,
    });

    //Email Details
    const verificationToken = jwt.sign(
      { user_email: user.email },
      process.env.EMAIL_SECRET,
      {
        expiresIn: "30m",
      }
    );

    user.verificationToken = verificationToken;

    const link = `${process.env.FRONTEND_URL}/verify-account/${verificationToken}`;

    const subject = "Welcome on Board";

    const messageData = {
      firstName: user.firstName,
      url: link,
      message: ' Please follow the link to verify your account'
    }
    await sendEmail(user.email, subject, "verify-email", messageData);

    const result = await user.save();

    return res.status(201).json({
      message:
        "Verification link has been sent to your email. To continue, please verify your email.",
      status: "success",
      data: { result },
    });
  } catch (error) {
    return res.status(500).json({
      status: "failed",
      data: null,
      message: "Unable to create a user",
    });
  }
};

module.exports = {
  verifyUser,
  forgetPassword,
  login,
  resetPassword,
  registerUser,
  preLogin,
};
