var nodemailer = require('nodemailer');
const user = require('../model/user');
const jwt = require("jsonwebtoken");

function email(email, id, userName) {

	const token = jwt.sign({ user_email: email }, process.env.EMAIL_SECRET, {expiresIn: "30m"});
	const link = `${process.env.BASE_URL}/users/confirmation/${token}`;

  	const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  
 console.log(process.env.PORT)

  const output = `
    <h3>You have successfully created your account</h3>
    <p>Dear ${userName}, welcome on board.</p> 
    <p>Kinldy click below to confirm your account.</p> 
    <a href= ${link}><h4>CLICK HERE TO CONFIRM YOUR EMAIL</h4></a> 
    <p>If the above link is not working, You can click the link below.</p>
    <p>${link}</p>
  `;

  var mailOptions = {
    from: '"GCMFB" <otunaiyademilade@gmail.com.com>',
    to: email,
    subject: "Welcome on Board",
    html: output,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log('Message sent successfully to ', info.envelope.to[0]);
  });
}

exports.sendEmail = email;