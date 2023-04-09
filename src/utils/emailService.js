var nodemailer = require('nodemailer');
const user = require('../model/user.model');
const jwt = require("jsonwebtoken");

function email(email, title, html) {

  const transporter = nodemailer.createTransport({
    service: "gmail",
    port: 465,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  var mailOptions = {
    from: '"GMFB" <gmfbcib@gmail.com>',
    to: email,
    subject: title,
    html: html,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log('Message sent successfully to ', info.envelope.to[0]);
  });
}

exports.sendEmail = email;
