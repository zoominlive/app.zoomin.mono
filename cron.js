const connectToDatabase = require('./models/index');
const Sequelize = require('sequelize');
const _ = require('lodash');
const moment = require('moment-timezone');

// cron to disable scheduled to end access members and children
module.exports.disableScheduledFamilyAndChild = async () => {
};

module.exports.enableScheduledChild = async () => {
  const { Child } = await connectToDatabase();

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

module.exports.enableDisableScheduledRoom = async () => {
  const { RoomsInChild, CustomerLocations, Room } = await connectToDatabase();

  let availableLocations = await CustomerLocations.findAll({
    raw: true
  });

  const enableRooms = await RoomsInChild.findAll({
    where: {
      scheduled_enable_date: {
        [Sequelize.Op.not]: null
      }
    },
    include: [{ model: Room, as: 'room' }]
  });

  const disableRooms = await RoomsInChild.findAll({
    where: {
      scheduled_disable_date: {
        [Sequelize.Op.not]: null
      }
    },
    include: [{ model: Room, as: 'room' }]
  });

  let roomsToEnable = [];
  enableRooms?.forEach((room) => {
    const timeZone = availableLocations?.find((loc) => loc?.loc_id == room?.room?.loc_id);
    const today = moment()?.tz(timeZone?.time_zone)?.format('YYYY-MM-DD');
    if (room?.scheduled_enable_date <= today) {
      roomsToEnable?.push(room?.room_child_id);
    }
  });

  let roomsToDisable = [];
  disableRooms?.forEach((room) => {
    const timeZone = availableLocations?.find((loc) => loc?.loc_id == room?.room?.loc_id);
    const today = moment()?.tz(timeZone?.time_zone)?.format('YYYY-MM-DD');
    if (room?.scheduled_disable_date <= today) {
      roomsToDisable?.push(room?.room_child_id);
    }
  });

  if (roomsToEnable?.length !== 0) {
    let update = {
      disabled: 'false',
      scheduled_enable_date: null
    };
    const enabledRooms = await RoomsInChild.update(update, {
      where: { room_child_id: roomsToEnable }
    });
  }

  if (roomsToDisable?.length !== 0) {
    let update = {
      disabled: 'true',
      scheduled_disable_date: null
    };
    const enabledRooms = await RoomsInChild.update(update, {
      where: { room_child_id: roomsToDisable }
    });
  }

  return { roomsToEnable, roomsToDisable };
};

module.exports.disableScheduledUsers = async () => {
  const { Child, Family, RoomsInChild, CustomerLocations, CustomerLocationAssignments } =
    await connectToDatabase();

  // Update object to disable entities
  const update = {
    status: "Disabled",
    scheduled_end_date: null,
  };

  try {
    // Fetch families to disable
    let disableAllMembers;
    try {
      disableAllMembers = await Family.findAll({
        where: { scheduled_end_date: { [Sequelize.Op.not]: null } },
        include: [{ model: CustomerLocations, as: "family_user_locations" }],
      });
    } catch (error) {
      console.error("Error fetching family members:", error);
      throw error;
    }
    
    // Fetch children to disable
    let disableAllChildren;
    try {
      disableAllChildren = await Child.findAll({
        where: { scheduled_end_date: { [Sequelize.Op.not]: null } },
        raw: true,
      });
    } catch (error) {
      console.error("Error fetching children:", error);
      throw error;
    }

    const today = moment().subtract(1, "day").format("YYYY-MM-DD");

    // Filter children to disable
    const childrenToDisable = disableAllChildren.filter(
      (child) => child.scheduled_end_date <= today
    );

    // Filter family members to disable
    const familyMembersToDisable = disableAllMembers.filter(
      (member) => member.dataValues.scheduled_end_date <= today
    );

    // Disable family members
    if (familyMembersToDisable.length > 0) {
      try {
        await Promise.all(
          familyMembersToDisable.map(async (member) => {
            const locationsToRemove =
              member?.dataValues?.disabled_locations?.locations || [];

            // Filter remaining locations
            const locations =
              member.dataValues.family_user_locations?.filter((loc) =>
                locationsToRemove.every(
                  (location) => location.loc_id !== loc.dataValues.loc_id
                )
              ) || [];
            
            const updateObj = { ...update };
            await Family.update(updateObj, {
              where: { family_member_id: member.dataValues.family_member_id },
            });

            locationsToRemove.forEach(async (item) => {
              await CustomerLocationAssignments.destroy({
                where: {[Sequelize.Op.and]: [{loc_id: item.loc_id}, {family_member_id: member.dataValues.family_member_id}]} 
              })
            });

          })
        ).catch((error) => {
          console.error("Error disabling family members:", error);
          throw error;
        });
      } catch (error) {
        console.error("Error disabling family members:", error);
        throw error;
      }
    }

    // Disable children
    if (childrenToDisable.length > 0) {
      try {
        await Promise.all(
          childrenToDisable.map(async (child) => {
            let roomsToRemove;
            try {
              roomsToRemove = await RoomsInChild.findAll({
                where: { child_id: child.child_id, disabled: "true" },
                raw: true,
              });
            } catch (error) {
              console.error(
                `Error fetching rooms for child ID ${child.child_id}:`,
                error
              );
              throw error;
            }

            const roomsToAdd =
              child?.rooms?.rooms?.filter((room) =>
                roomsToRemove.every((room1) => room.room_id !== room1.room_id)
              ) || [];

            console.log("Filtered rooms to add:", roomsToAdd);

            const updateObj = { ...update };
            await Child.update(updateObj, {
              where: { child_id: child.child_id },
            });
          })
        ).catch((error) => {
          console.error("Error disabling children:", error);
          throw error;
        });
      } catch (error) {
        console.error("Error disabling children:", error);
        throw error;
      }
    }

    return { childrenToDisable, familyMembersToDisable };
  } catch (error) {
    console.error(
      "Error in disableScheduledFamilyAndChild function:",
      error.message
    );
    throw error; // Optionally rethrow for higher-level error handling
  }
}