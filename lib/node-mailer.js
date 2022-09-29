const fs = require('fs');
const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const path = require('path');

/* Node mailer transporter */
const transporter = nodemailer.createTransport({
  host: 'smtp.mailtrap.io',
  port: 2525,
  auth: {
    user: '5e0526f3effd8b',
    pass: '47c6a3df19823e'
  }
});

/* send mail to receiver */
const sendOTPMail = (sendMailTo, data) => {
  let mailOptions = {
    from: 'kashyap.j@crestinfosystems.net',
    to: sendMailTo,
    subject: 'Zoomin-Live User Registration',
    text: data
  };

  transporter.sendMail(mailOptions, function (err, data) {
    if (err) {
      console.log('Error ' + err);
    } else {
    }
  });
};

module.exports = {
  sendOTPMail
};
