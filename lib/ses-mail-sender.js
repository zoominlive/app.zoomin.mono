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
          Data: 'ZOOMIN Live Account Registration'
        }
      },
      Subject: {
        Data: 'ZOOMIN Live Account Registration'
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
          Data: 'ZOOMIN Live Account Registration'
        }
      },
      Subject: {
        Data: 'ZOOMIN Live Account Registration'
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
          Data: 'ZOOMIN Live Account Email Change'
        }
      },
      Subject: {
        Data: 'ZOOMIN Live Account Email Change'
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
          Data: 'ZOOMIN Live Account Password Reset'
        }
      },
      Subject: {
        Data: 'ZOOMIN Live Account Password Reset'
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

const shareRecordingUrl = async (email, url, sender, receiver_name, expiry_date, thumbnail_url, organization_name) => {
  const filePath = path.join(__dirname, '../template/shared-recording.html');
  const source = fs.readFileSync(filePath, 'utf-8').toString();
  const template = handlebars.compile(source);

  const replacements = {
    url: url,
    sender_name: sender,
    receiver_name: receiver_name,
    site_url: 'https://www.zoominlive.com/',
    expiry_date: expiry_date,
    year: '2025',
    thumbnail_url: thumbnail_url,
    organization_name: organization_name
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
          Data: 'Shared Recording'
        }
      },
      Subject: {
        Data: 'Recording'
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

const reportIssue = async (
  issueType,
  email,
  reporterName,
  reporterEmail,
  issueReportedAt,
  eventName,
  custName,
  location,
  camName,
  zoneName,
  url,
  thumbnail_url
) => {
  const filePath = path.join(__dirname, "../template/report.html");
  const source = fs.readFileSync(filePath, "utf-8").toString();
  const template = handlebars.compile(source);

  const replacements = {
    issueType: issueType,
    issueReportedAt: issueReportedAt,
    eventName: eventName,
    custName: custName,
    location: location,
    camName: camName,
    zoneName: zoneName,
    url: url,
    thumbnail_url: thumbnail_url,
    reportingUserName: reporterName,
    reportingUserEmail: reporterEmail,
    year: "2025",
  };
  const htmlToSend = template(replacements);

  const params = {
    Source: email,
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: htmlToSend,
        },
        Text: {
          Data: "Reported an Issue",
        },
      },
      Subject: {
        Data: "Reported an Issue",
      },
    },
  };
  try {
    const response = await ses.sendEmail(params).promise();
    return {
      IsSuccess: true,
      Message: "Issue Reported Successfully",
      SESResponse: response,
    };
  } catch (error) {
    let errorMessage = "Failed to send email";

    // Handle AWS SES-specific errors
    if (error.code === "MessageRejected") {
      errorMessage = "Email address is not verified in AWS SES";
    } else if (error.code === "InvalidParameterValue") {
      errorMessage = "Invalid email parameter provided";
    }

    return {
      IsSuccess: false,
      Message: errorMessage,
      Error: error.message,
    };
  }
};

module.exports = {
  sendRegistrationMailforUser,
  sendRegistrationMailforFamilyMember,
  sendEmailChangeMail,
  sendForgetPasswordMail,
  shareRecordingUrl,
  reportIssue
};
