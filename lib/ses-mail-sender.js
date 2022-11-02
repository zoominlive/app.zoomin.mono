const AWS = require('aws-sdk');
const fs = require('fs');
const handlebars = require('handlebars');
const path = require('path');

AWS.config.update({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  AWS_SDK_LOAD_CONFIG: 1
});

const ses = new AWS.SES({ region: 'us-west-2' });

// send new registration verification and password set mail to new user
const sendRegistrationMailforUser = async (name, email, url) => {
  const filePath = path.join(__dirname, '../template/user-registration.html');
  const source = fs.readFileSync(filePath, 'utf-8').toString();
  const template = handlebars.compile(source);

  const replacements = {
    name: name,
    url: url
  };
  const htmlToSend = template(replacements);
  const params = {
    Source: process.env.EMAIL_SOURCE_ACCOUNT,
    Destination: {
      ToAddresses: [email]
    },
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: htmlToSend
        },
        Text: {
          Data: 'Welcome to zoomin'
        }
      },
      Subject: {
        Data: 'Welcome to zoomin'
      }
    }
  };

  try {
    const response = await ses.sendEmail(params).promise();
    return response;
  } catch (error) {
    return error;
  }
};

// send new registration verification and password set mail to new user
const sendRegistrationMailforFamilyMember = async (name, email, url) => {
  const filePath = path.join(__dirname, '../template/familyMember-registration.html');
  const source = fs.readFileSync(filePath, 'utf-8').toString();
  const template = handlebars.compile(source);

  const replacements = {
    name: name,
    url: url
  };
  const htmlToSend = template(replacements);
  const params = {
    Source: process.env.EMAIL_SOURCE_ACCOUNT,
    Destination: {
      ToAddresses: [email]
    },
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: htmlToSend
        },
        Text: {
          Data: 'Welcome to zoomin'
        }
      },
      Subject: {
        Data: 'Welcome to zoomin'
      }
    }
  };

  try {
    const response = await ses.sendEmail(params).promise();
    return response;
  } catch (error) {
    return error;
  }
};

// send email change verification mail to user
const sendEmailChangeMail = async (name, email, url) => {
  const filePath = path.join(__dirname, '../template/email-change.html');
  const source = fs.readFileSync(filePath, 'utf-8').toString();
  const template = handlebars.compile(source);

  const replacements = {
    name: name,
    url: url
  };
  const htmlToSend = template(replacements);
  const params = {
    Source: process.env.EMAIL_SOURCE_ACCOUNT,
    Destination: {
      ToAddresses: [email]
    },
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: htmlToSend
        },
        Text: {
          Data: 'Welcome to zoomin'
        }
      },
      Subject: {
        Data: 'Welcome to zoomin'
      }
    }
  };

  try {
    const response = await ses.sendEmail(params).promise();
    return response;
  } catch (error) {
    return error;
  }
};

// send password reset link mail to user
const sendForgetPasswordMail = async (name, email, url) => {
  const filePath = path.join(__dirname, '../template/password-reset.html');
  const source = fs.readFileSync(filePath, 'utf-8').toString();
  const template = handlebars.compile(source);

  const replacements = {
    name: name,
    url: url
  };
  const htmlToSend = template(replacements);
  const params = {
    Source: process.env.EMAIL_SOURCE_ACCOUNT,
    Destination: {
      ToAddresses: [email]
    },
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: htmlToSend
        },
        Text: {
          Data: 'Welcome to zoomin'
        }
      },
      Subject: {
        Data: 'Welcome to zoomin'
      }
    }
  };

  try {
    const response = await ses.sendEmail(params).promise();
    return response;
  } catch (error) {
    return error;
  }
};

module.exports = {
  sendRegistrationMailforUser,
  sendRegistrationMailforFamilyMember,
  sendEmailChangeMail,
  sendForgetPasswordMail
};
