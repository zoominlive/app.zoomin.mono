const connectToDatabase = require('../models/index');
const Sequelize = require('sequelize');

module.exports = {
  createFcmToken: async (Obj, t) => {
    const { FcmTokens } = await connectToDatabase();
    let fcmCreated = await FcmTokens.create(Obj, { transaction: t });
    return fcmCreated;
  },

  getFamilyMembersFcmTokens: async (allfamilyIds) => {
    const { FcmTokens } = await connectToDatabase();
    let fcmTokens = await FcmTokens.findAll(
      {
        raw: true,
        where: {
          family_member_id: {
            [Sequelize.Op.in]: allfamilyIds,
          },
        },
        attributes: ['fcm_token']
      },
    );
    return fcmTokens;
  },
};
