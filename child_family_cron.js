const connectToDatabase = require('./models/index');
const Sequelize = require('sequelize');
const _ = require('lodash');
const moment = require('moment-timezone');

// cron to disable scheduled to end access members and children
module.exports.disableScheduledFamilyAndChild = async () => {
  const { Child, Family, RoomsInChild } = await connectToDatabase();
  let update = {
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
    const today = child?.time_zone
      ? moment()?.tz(child?.time_zone)?.subtract(1, 'd')?.format('YYYY-MM-DD')
      : moment()?.subtract(1, 'd')?.format('YYYY-MM-DD');
    if (child?.scheduled_end_date <= today) {
      childrenToDisable.push(child);
    }
  });

  let familyMembersToDisable = [];
  disableAllMembers?.forEach((member) => {
    const today = member?.time_zone
      ? moment()?.tz(member?.time_zone)?.subtract(1, 'd')?.format('YYYY-MM-DD')
      : moment()?.subtract(1, 'd')?.format('YYYY-MM-DD');
    if (member?.scheduled_end_date <= today) {
      familyMembersToDisable.push(member);
    }
  });

  if (familyMembersToDisable.length !== 0) {
    await Promise.all(
      familyMembersToDisable.map(async (member) => {
        const locationsToRemove = member?.disabled_locations?.locations;

        const locations = member.location.selected_locations.filter((loc) => {
          let count = 0;
          locationsToRemove.forEach((location) => {
            if (location == loc) {
              count = 1;
            }
          });

          return count == 0;
        });

        let updateObj = {
          ...update,
          location: { selected_locations: locations, accessable_locations: locations }
        };

        const updatedFamily = await Family.update(updateObj, {
          where: { family_member_id: member.family_member_id }
        });
      })
    );
  }

  if (childrenToDisable.length !== 0) {
    await Promise.all(
      childrenToDisable.map(async (child) => {
        const roomsToRemove = await RoomsInChild.findAll({
          where: { child_id: child.child_id, disabled: 'true' },
          raw: true
        });

        const roomsToAdd = child?.rooms?.rooms?.filter((room) => {
          let count = 0;

          roomsToRemove.forEach((room1) => {
            if (room.room_id === room1.room_id) {
              count = 1;
            }
          });

          return count == 0;
        });

        let updateObj = { ...update, rooms: { rooms: roomsToAdd } };

        const updatedChildren = await Child.update(updateObj, {
          where: { child_id: child.child_id }
        });
      })
    );
  }

  return { childrenToDisable, familyMembersToDisable };
};

module.exports.enableScheduledChild = async () => {
  const { Child, Family, RoomsInChild } = await connectToDatabase();

  let update = {
    status: 'Enabled',
    scheduled_enable_date: null
  };

  const enableAllChildren = await Child.findAll({
    where: {
      scheduled_enable_date: {
        [Sequelize.Op.not]: null
      }
    },
    raw: true
  });

  let childrenToEnable = [];
  enableAllChildren?.forEach((child) => {
    const today = child?.time_zone
      ? moment()?.tz(child?.time_zone)?.format('YYYY-MM-DD')
      : moment()?.format('YYYY-MM-DD');
    if (child?.scheduled_enable_date <= today) {
      childrenToEnable.push(child.child_id);
    }
  });

  if (childrenToEnable.length !== 0) {
    const updatedChildren = await Child.update(update, {
      where: { child_id: childrenToEnable }
    });
  }

  return { childrenToEnable };
};
