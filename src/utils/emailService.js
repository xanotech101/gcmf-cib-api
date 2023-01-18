var nodemailer = require('nodemailer');

function email(userName, email, code) {
  // var transport = nodemailer.createTransport({
  //   host: "smtp.mailtrap.io",
  //   port: 2525,
  //   auth: {
  //     user: "1a2b3c4d5e6f7g",
  //     pass: "1a2b3c4d5e6f7g"
  //   }
  // });

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
    from: '"Microfinance Bank" <otunaiyademilade@gmail.com.com>',
    to: email,
    subject: "Welcome on Board",
    // text: 'Hey there, it’s our first message sent with Nodemailer ',
    html: output,
    // html: output,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log('Message sent successfully to ', info.envelope.to[0]);
  });
}

exports.sendEmail = email;