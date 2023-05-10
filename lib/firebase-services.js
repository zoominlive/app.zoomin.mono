const admin = require('firebase-admin');
const serviceAccount = require('../config/firebase_service_account_config')

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

const sendNotification = async (title, body, image, fcmTokens, details = {}) => {
          try {
            let message = {
                tokens: fcmTokens,
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
                  image: image,
                  ...details
                },
            };
              let resp = await admin.messaging().sendMulticast(message)

            } catch (error) {
              console.log(error);
            }
  };
  
  module.exports = {
    sendNotification
  };
  