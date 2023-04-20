var nodemailer = require('nodemailer');
const path = require('path')
const hbs = require('nodemailer-express-handlebars')

function email(email, title, html, context) {

  const transporter = nodemailer.createTransport({
    service: "gmail",
    port: 465,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const hbsConfig = {
    viewEngine: {
      extName: '.hbs',
      partialsDir: path.join(__dirname, '../views/'),
      layoutsDir: path.join(__dirname, '../views/'),
      defaultLayout: '',
    },
    viewPath: path.join(__dirname, '../views/'),
    extName: '.hbs',
  }

  transporter.use('compile', hbs(hbsConfig));

  const mailOptions = {
    from: '"GMFB CIB" <gmfbcib@gmail.com>',
    to: email,
    subject: title,
    template: html,
    context
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log('Message sent successfully to ', info.envelope.to[0]);
  });
}

exports.sendEmail = email;
