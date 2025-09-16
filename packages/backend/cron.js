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

module.exports.enableDisableScheduledZone = async () => {
  const { ZonesInChild, CustomerLocations, Zone } = await connectToDatabase();

  let availableLocations = await CustomerLocations.findAll({
    raw: true
  });

  const enableZones = await ZonesInChild.findAll({
    where: {
      scheduled_enable_date: {
        [Sequelize.Op.not]: null
      }
    },
    include: [{ model: Zone, as: 'zone' }]
  });

  const disableZones = await ZonesInChild.findAll({
    where: {
      scheduled_disable_date: {
        [Sequelize.Op.not]: null
      }
    },
    include: [{ model: Zone, as: 'zone' }]
  });

  let zonesToEnable = [];
  enableZones?.forEach((zone) => {
    const timeZone = availableLocations?.find((loc) => loc?.loc_id == zone?.zone?.loc_id);
    const today = moment()?.tz(timeZone?.time_zone)?.format('YYYY-MM-DD');
    if (zone?.scheduled_enable_date <= today) {
      zonesToEnable?.push(zone?.zone_child_id);
    }
  });

  let zonesToDisable = [];
  disableZones?.forEach((zone) => {
    const timeZone = availableLocations?.find((loc) => loc?.loc_id == zone?.zone?.loc_id);
    const today = moment()?.tz(timeZone?.time_zone)?.format('YYYY-MM-DD');
    if (zone?.scheduled_disable_date <= today) {
      zonesToDisable?.push(zone?.zone_child_id);
    }
  });

  if (zonesToEnable?.length !== 0) {
    let update = {
      disabled: 'false',
      scheduled_enable_date: null
    };
    const enabledZones = await ZonesInChild.update(update, {
      where: { zone_child_id: zonesToEnable }
    });
  }

  if (zonesToDisable?.length !== 0) {
    let update = {
      disabled: 'true',
      scheduled_disable_date: null
    };
    const enabledZones = await ZonesInChild.update(update, {
      where: { zone_child_id: zonesToDisable }
    });
  }

  return { zonesToEnable, zonesToDisable };
};

const serializeSequelizeInstances = (instances) => {
  if (!instances || !Array.isArray(instances)) {
    console.error("Invalid Sequelize instances:", instances);
    return [];
  }
  return instances
    .map((instance) => {
      if (!instance || typeof instance.get !== "function") {
        console.error("Invalid Sequelize instance:", instance);
        return null;
      }
      return instance.get({ plain: true });
    })
    .filter(Boolean);
};

module.exports.disableScheduledUsers = async () => {
  const { Child, Family, ZonesInChild, CustomerLocations, CustomerLocationAssignments } =
    await connectToDatabase();

  // Update object to disable entities
  const update = {
    status: "Disabled",
    scheduled_end_date: null,
  };

  const today = moment().subtract(1, "day").format("YYYY-MM-DD");

  try {
    // Fetch families to disable
    const disableAllMembers = await Family.findAll({
      where: { scheduled_end_date: { [Sequelize.Op.not]: null } },
      include: [{ model: CustomerLocations, as: "family_user_locations" }],
    });

    console.log("disableAllMembers:", disableAllMembers);

    const familyMembersToDisable = serializeSequelizeInstances(
      disableAllMembers.filter((member) => {
        return member?.scheduled_end_date <= today;
      })
    );

    console.log("familyMembersToDisable:", familyMembersToDisable);

    // Fetch children to disable
    const disableAllChildren = await Child.findAll({
      where: { scheduled_end_date: { [Sequelize.Op.not]: null } },
      raw: true,
    });

    console.log("disableAllChildren:", disableAllChildren);

    const childrenToDisable = disableAllChildren.filter(
      (child) => child.scheduled_end_date <= today
    );

    console.log("childrenToDisable:", childrenToDisable);

    // Disable family members
    if (familyMembersToDisable.length > 0) {
      await Promise.all(
        familyMembersToDisable.map(async (member) => {
          const { family_member_id, disabled_locations, family_user_locations } = member;

          const locationsToRemove = disabled_locations?.locations || [];
          const remainingLocations = family_user_locations?.filter((loc) =>
            locationsToRemove.every((location) => location.loc_id !== loc.loc_id)
          );

          try {
            await Family.update(update, { where: { family_member_id } });

            for (const location of locationsToRemove) {
              try {
                await CustomerLocationAssignments.destroy({
                  where: {
                    [Sequelize.Op.and]: [{ loc_id: location.loc_id }, { family_member_id }],
                  },
                });
              } catch (error) {
                console.error(`Error deleting location ID ${location.loc_id}:`, error);
              }
            }
          } catch (error) {
            console.error(`Error updating family member ID ${family_member_id}:`, error);
          }
        })
      );
    }

    // Disable children
    if (childrenToDisable.length > 0) {
      await Promise.all(
        childrenToDisable.map(async (child) => {
          const { child_id } = child;

          let zonesToRemove;
          try {
            zonesToRemove = await ZonesInChild.findAll({
              where: { child_id, disabled: "true" },
              raw: true,
            });
          } catch (error) {
            console.error(`Error fetching zones for child ID ${child_id}:`, error);
            return;
          }

          const zonesToAdd =
            child?.zones?.zones?.filter((zone) =>
              zonesToRemove.every((zone) => zone.zone_id !== zone.zone_id)
            ) || [];

          console.log(`Filtered zones to add for child ${child_id}:`, zonesToAdd);

          try {
            await Child.update(update, { where: { child_id } });
          } catch (error) {
            console.error(`Error updating child ID ${child_id}:`, error);
          }
        })
      );
    }

    return { childrenToDisable, familyMembersToDisable };
  } catch (error) {
    console.error("Error in disableScheduledFamilyAndChild function:", error.message);
    throw error; // Optionally rethrow for higher-level error handling
  }
};