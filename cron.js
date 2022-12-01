const { Child, Family } = require('./models/index');
const Sequelize = require('sequelize');
const _ = require('lodash');
const moment = require('moment-timezone');

// cron to disable scheduled to end access members and children
module.exports.disableScheduledFamilyAndChild = async () => {
  let update = {
    updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
    status: 'Disabled',
    scheduled_end_date: null
  };

  const disableAllMembers = await Family.findAll({
    where: {
      scheduled_end_date: {
        [Sequelize.Op.not]: null
      }
    },
    raw: true
  });

  const disableAllChildren = await Child.findAll({
    where: {
      scheduled_end_date: {
        [Sequelize.Op.not]: null
      }
    },
    raw: true
  });

  let childrenToDisable = [];
  disableAllChildren?.forEach((child) => {
    const today = moment()?.tz(child?.time_zone)?.subtract(1, 'd')?.format('YYYY-MM-DD');
    if (child?.scheduled_end_date === today) {
      childrenToDisable.push(child?.child_id);
    }
  });

  let familyMembersToDisable = [];
  disableAllMembers?.forEach((member) => {
    const today = moment()?.tz(member?.time_zone)?.subtract(1, 'd')?.format('YYYY-MM-DD');
    if (member?.scheduled_end_date === today) {
      familyMembersToDisable.push(member?.family_member_id);
    }
  });

  if (familyMembersToDisable.length !== 0) {
    const updatedFamily = await Family.update(update, {
      where: { family_member_id: familyMembersToDisable }
    });
  }

  if (childrenToDisable.length !== 0) {
    const updatedChildren = await Child.update(update, { where: { child_id: childrenToDisable } });
  }

  return { childrenToDisable, familyMembersToDisable };
};
