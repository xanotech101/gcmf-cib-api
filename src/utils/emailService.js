var nodemailer = require('nodemailer');

function email(userName, email, code) {

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
    <p>Kinldy use the code below to activate your account.</p> 
    <h4>${code}</h4> 
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