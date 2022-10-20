const { Child, Family } = require('./models/index');
const Sequelize = require('sequelize');
const _ = require('lodash');
const moment = require('moment');
const sequelize = require('./lib/database');

module.exports.disableScheduledFamilyAndChild = async (event, context, callback) => {
  // disable primary parent and family
  const today = moment().format('YYYY-MM-DD');
  // const todayDate = date.getUTCFullYear() + '-' + date.getUTCMonth() + '-' + date.getUTCDate();
  console.log(today);
  let update = {
    updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
    status: 'Disabled',
    scheduled_end_date: null
  };
  const disableAllMembers = await Family.update(update, {
    where: {
      scheduled_end_date: {
        [Sequelize.Op.eq]: today
      }
    }
  });
  const disableAllChildren = await Child.update(update, {
    where: {
      scheduled_end_date: {
        [Sequelize.Op.eq]: today
      }
    }
  });

  callback();
};
