const admin = require('firebase-admin');
const serviceAccount = require('../config/firebase_service_account_config')

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

const sendNotification = async (title, body, image, fcmTokens) => {
    try {
        fcmTokens.forEach(async fcm_token => {
            let message = {
                notification: {
                     title: title,
                     body: body,
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                        }
                    },
                },
                android: {
                  notification: {
                      sound: 'default',
                  }
                },
                data: {
                  image: image
                },
                token: fcm_token,
            };
              let resp = await admin.messaging().send(message)
        });
      
    return {isSent: true};
    } catch (error) {
      return {isSent: false, ...error};
    }
  };
  
  module.exports = {
    sendNotification
  };
  