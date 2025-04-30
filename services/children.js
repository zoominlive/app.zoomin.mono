const connectToDatabase = require('../models/index');
const Sequelize = require('sequelize');
const _ = require('lodash');
const ZonesInChild = require('../models/zones_assigned_to_child');
const { v4: uuidv4 } = require("uuid");

module.exports = {
  /* Create new child */
  createChild: async (custID, childObj, t) => {
    let createObj = {
      ...childObj,
      child_id: uuidv4(),
      status: childObj?.enable_date !== null ? 'Disabled' : 'Enabled',
      scheduled_enable_date: childObj?.enable_date,
      cust_id:custID
    };
    const { Child, CustomerLocationAssignments } = await connectToDatabase();
    let childCreated = await Child.create(createObj, { transaction: t });
    
    const locationsToAdd = childObj.location.locations.map((_) => {
      return {
        loc_id: _.loc_id,
        cust_id: childObj.cust_id,
        child_id: childCreated.child_id,
        family_id: childObj.family_id
      };
    });
    
    await CustomerLocationAssignments.bulkCreate(locationsToAdd, {
      transaction: t,
    });

    return childCreated !== undefined ? childCreated.toJSON() : null;
  },

  createChildren: async (childObj, t) => {
    let childObjs = childObj?.map((child) => {
      return {
        ...child,
        child_id: uuidv4(),
        status: child?.enable_date !== null ? 'Disabled' : 'Enabled',
        scheduled_enable_date: child?.enable_date
      };
    });
    const { Child, CustomerLocationAssignments } = await connectToDatabase();
    let childCreated = await Child.bulkCreate(childObjs, { returning: true }, { transaction: t });

    await Promise.all(
      childObjs.map(async (child, index) => {
        let zonesInChild = child.zones.zones.map((zone) => {
          return {  child_id: childCreated[index].child_id, zone_id: zone.zone_id,
                    disabled: child?.enable_date !== null ? 'true' : 'false',
                    scheduled_enable_date: child?.enable_date !== null ? child?.enable_date : null};
        });
        await ZonesInChild.bulkCreate(zonesInChild, { returning: true }, { transaction: t });
        
        const locationsToAdd = child.location.locations.map((_) => {
          return {
            loc_id: _.loc_id,
            cust_id: child.cust_id,
            child_id: childCreated[index].child_id,
            family_id: childCreated[index].family_id
          };
        });
        
        await CustomerLocationAssignments.bulkCreate(locationsToAdd, {
          transaction: t,
        });
      })
    );
    // const addZonesToChild = await childServices.assignZonesToChild(
    //   newChild?.child_id,
    //   params?.zones?.zones,
    //   t
    // );

    return childCreated;
  },

  /* Edit child details */
  editChild: async (params, t) => {
    const { Child, CustomerLocationAssignments } = await connectToDatabase();
    const childObj = _.omit(params, ['child_id']);
    let update = {
      ...childObj
    };

    let updateChildDetails = await Child.update(
      update,
      {
        where: { child_id: params.child_id }
      },
      { transaction: t }
    );
    if(params.location) {
      const locationsToAdd = params.location.locations.map((loc) => {
        return {
          loc_id: loc.loc_id,
          cust_id: params.cust_id,
          child_id: params.child_id,
          cust_id: params.cust_id,
          family_id: params.family_id,
          family_member_id: params.family_member_id
        };
      });

      await CustomerLocationAssignments.destroy(
        {
          where: { child_id: params.child_id },
          raw: true,
        },
        { transaction: t }
      );
      
      await CustomerLocationAssignments.bulkCreate(locationsToAdd, {
        transaction: t,
      });
    }

    if (updateChildDetails) {
      updateChildDetails = await Child.findOne(
        {
          where: { child_id: params.child_id }
        },
        { transaction: t }
      );
    }

    return updateChildDetails.toJSON();
  },
  // get all children for given family Id
  getAllchildren: async (familyId, t) => {
    const { Child } = await connectToDatabase();
    childDetails = await Child.findAll(
      {
        raw: true,
        where: { family_id: familyId }
      },
      { transaction: t }
    );

    return childDetails;
  },

  // get all children for given family Id
  getChildById: async (childId, t) => {
    const { Child, CustomerLocations } = await connectToDatabase();
    childDetails = await Child.findOne(
      {
        // raw: true,
        where: { child_id: childId },
        include: [
          {
            model: CustomerLocations,
            as: 'child_locations',
            attributes: ['loc_id', 'loc_name']
          }
        ]
      },
      { transaction: t }
    );

    return childDetails;
  },

  // delete selected child
  deleteChild: async (childId, t) => {
    const { Child, ZonesInChild, CustomerLocationAssignments } = await connectToDatabase();

    let zonesDeleted = await ZonesInChild.destroy(
      { where: { child_id: childId }, raw: true },
      { transaction: t }
    );

    let deletedChild = await Child.destroy(
      {
        where: { child_id: childId },
        raw: true
      },
      { transaction: t }
    );

    let deletedChildFromCustLocAssignment = await CustomerLocationAssignments.destroy(
      {
        where: { child_id: childId },
        raw: true
      },
      { transaction: t }
    );

    return deletedChild, deletedChildFromCustLocAssignment;
  },

  //disable selected child
  disableChild: async (childId, schedluedEndDate = null, t) => {
    const { Child } = await connectToDatabase();
    let updateChildDetails;

    if (schedluedEndDate != null && schedluedEndDate != '' && schedluedEndDate != false) {
      let update = {
        scheduled_end_date: schedluedEndDate
      };

      updateChildDetails = await Child.update(
        update,
        {
          where: { child_id: childId },
          raw: true
        },
        { transaction: t }
      );

      let updateZones = await ZonesInChild.update(
        { scheduled_enable_date: null, scheduled_disable_date: schedluedEndDate, disabled: 'false' },
          {
            where: {
              child_id: childId
            }
          },
          { transaction: t }
        );
      if (updateChildDetails) {
        updateChildDetails = await Child.findOne(
          {
            where: { child_id: childId },
            raw: true
          },
          { transaction: t }
        );
      }

    } else {
      let update = {
        status: 'Disabled',
        scheduled_end_date: null,
        scheduled_enable_date: null
      };

      updateChildDetails = await Child.update(
        update,
        {
          where: { child_id: childId },
          raw: true
        },
        { transaction: t }
      );
      let updateZones = await ZonesInChild.update(
        { scheduled_enable_date: null, scheduled_disable_date: null, disabled: 'true' },
          {
            where: {
              child_id: childId
            }
          },
          { transaction: t }
        );
      if (updateChildDetails) {
        updateChildDetails = await Child.findOne(
          {
            where: { child_id: childId },
            raw: true
          },
          { transaction: t }
        );
      }
    }

    return updateChildDetails;
  },

  //enable selected child
  enableChild: async (childId, t) => {
    const { Child, ZonesInChild } = await connectToDatabase();
    let update = {
      status: 'Enabled',
      scheduled_end_date: null,
      scheduled_enable_date: null
    };

    let updateChildDetails = await Child.update(
      update,
      {
        where: { child_id: childId },
        raw: true
      },
      { transaction: t }
    );

    let enableZones = await ZonesInChild.update(
    { scheduled_enable_date: null, scheduled_disable_date: null, disabled: 'false' },
      {
        where: {
          child_id: childId
        }
      },
      { transaction: t }
    );
    if (updateChildDetails) {
      updateChildDetails = await Child.findOne(
        {
          where: { child_id: childId },
          raw: true
        },
        { transaction: t }
      );
    }

    return updateChildDetails;
  },

  assignZonesToChild: async (childId, zones, t) => {
    const { ZonesInChild } = await connectToDatabase();
    const zonesToadd = zones.map((zone) => {
      return {
        zone_id: zone.zone_id,
        child_id: childId,
        scheduled_enable_date: zone.scheduled_enable_date
      };
    });

    let zonesAdded = await ZonesInChild.bulkCreate(zonesToadd, { transaction: t });

    return zonesAdded;
  },

  editAssignedZonesToChild: async (childId, zones, t) => {
    const { ZonesInChild } = await connectToDatabase();
    const zonesToadd = zones.map((zone) => {
      return {
        zone_id: zone.zone_id,
        child_id: childId
      };
    });

    let zonesRemoved = await ZonesInChild.destroy(
      { where: { child_id: childId }, raw: true },
      { transaction: t }
    );

    let zonesAdded = await ZonesInChild.bulkCreate(zonesToadd, { transaction: t });

    return zonesAdded;
  },

  deleteAssignedZonesToChild: async (childId, t) => {
    const { ZonesInChild } = await connectToDatabase();
    let zonesDeleted = await ZonesInChild.destroy(
      { where: { child_id: childId }, raw: true },
      { transaction: t }
    );

    return zonesDeleted;
  },

  disableSelectedZonesForChild: async (childId, zoneIds, t) => {
    const { ZonesInChild } = await connectToDatabase();
    let disabledZones = await ZonesInChild.update(
      { disabled: true },
      {
        where: { child_id: childId, zone_id: zoneIds },
        raw: true
      },
      { transaction: t }
    );

    return disabledZones;
  },

  addZonesToChild: async (childId, t) => {
    const { ZonesInChild, Zone } = await connectToDatabase();
    let disabledZones = await ZonesInChild.findAll(
      {
        where: { child_id: childId },
        include: [{ model: Zone, as: 'zone', attributes: ['zone_id', 'location', 'zone_name'] }]
      },
      { transaction: t }
    );

    return disabledZones;
  },

  addNewZonesToChild: async (childId, zonesToAdd, selectedOption, scheduled_enable_date, t) => {
    const { ZonesInChild } = await connectToDatabase();
    let addZones;
    if (selectedOption == 'enable') {
      const zonesToadd = zonesToAdd.map((zone) => {
        return {
          zone_id: zone.zone_id,
          child_id: childId,
          disabled: 'false'
        };
      });
      addZones = await ZonesInChild.bulkCreate(zonesToadd, { transaction: t });
    } else {
      const zonesToadd = zonesToAdd.map((zone) => {
        return {
          zone_id: zone.zone_id,
          child_id: childId,
          disabled: 'true',
          scheduled_enable_date: scheduled_enable_date
        };
      });
      addZones = await ZonesInChild.bulkCreate(zonesToadd, { transaction: t });
    }

    return addZones;
  },

  changeZoneScheduler: async (zoneChildId, update, t) => {
    const { ZonesInChild } = await connectToDatabase();

    let schedule = await ZonesInChild.update(
      { schedule: update },
      {
        where: { zone_child_id: zoneChildId },
      },
      { transaction: t }
    );

    return schedule;
  },

  changeDefaultZoneScheduler: async (custId, update, t) => {
    const { DefaultSchedule } = await connectToDatabase();

    // Check if a record with the given custId exists
    let existingSchedule = await DefaultSchedule.findOne({
      where: { cust_id: custId },
    });
    if (existingSchedule) {
      let schedule = await DefaultSchedule.update(
        {
          schedule: update,
        },
        {
          where: { cust_id: custId },
        },
        { transaction: t }
      );
      return schedule;
    } else {
      // If no record exists, create a new one
      let newSchedule = await DefaultSchedule.create(
        {
          cust_id: custId,
          schedule: update,
        },
        { transaction: t }
      );
      return newSchedule;
    }
  },

  getScheduleByCustId: async (custId, t) => {
    const { DefaultSchedule } = await connectToDatabase();

    let schedule = await DefaultSchedule.findOne(
      {
        where: { cust_id: custId },
      },
      { transaction: t }
    );

    return schedule;
  },

  disableSelectedLocations: async (childId, SED, locationsToDisable, t) => {
    const { ZonesInChild, Zone } = await connectToDatabase();
    let mappedLocationstoDisable = locationsToDisable.map(({loc_id}) => loc_id)
    let getZonesToDisable = await ZonesInChild.findAll(
      {
        where: {
          child_id: childId
        },
        attributes: ['zone_child_id'],
        include: [
          {
            model: Zone,
            as: 'zone',
            where: {
              location: mappedLocationstoDisable
            },
            attributes: ['zone_name']
          }
        ]
      },
      { transaction: t }
    );

    let zoneChildIds = getZonesToDisable?.map((zone) => zone.zone_child_id);
    let disableZones;

    if (SED != null && SED != '' && SED != false) {
      disableZones = await ZonesInChild.update(
        { scheduled_disable_date: SED },
        {
          where: {
            zone_child_id: zoneChildIds
          }
        },
        { transaction: t }
      );
    } else {
      disableZones = await ZonesInChild.update(
        { disabled: 'true' },
        {
          where: {
            zone_child_id: zoneChildIds
          }
        },
        { transaction: t }
      );
    }

    return disableZones;
  },

  getChildOfAssignedZoneId: async (zoneID, t) => {
    const { ZonesInChild } = await connectToDatabase();
    let zoneChilds = await ZonesInChild.findAll(
      {
        raw: true,
        where: { zone_id: zoneID },
        attributes: ['child_id']

        },
      { transaction: t }
    );

    return zoneChilds;
  },

  getAllchildrensFamilyId: async (allChildId, t) => {
    const { Child } = await connectToDatabase();
    let childFamilyDetails = await Child.findAll(
      {
        raw: true,
        where: {
          child_id: {
            [Sequelize.Op.in]: allChildId,
          },
        },
        attributes: ['family_id']
      },
      { transaction: t }
    );

    return childFamilyDetails;
  },

  getAllChildren: async (custId, location = ["Select All"], t) => {
    const { Child, CustomerLocations } = await connectToDatabase();
    const distinctChildIds = await Child.findAll(
      {
        where: { cust_id: custId },
        attributes: [ [Sequelize.fn('DISTINCT', Sequelize.col('child_id')) ,'child_id']],
        group: ["child_id"],
        raw: true,
      },
      { transaction: t }
    );
    
    const childIdsArray = distinctChildIds.map(child => child.child_id);
    
    let childIdsWithLocations = await Child.findAll({
      where: { child_id: childIdsArray },
      include: [
        {
          model: CustomerLocations,
          as: "child_locations",
        },
      ],
      group: ["child_id"],
      transaction: t,
    });
    
    if(!location.includes("Select All")){
      let filterResult = []
      location = location.map(Number);
      childIdsWithLocations.map((i) => {        
        if(i.child_locations?.map((item) => item.dataValues.loc_id).every(it => location.includes(it)))
        {
          filterResult.push(i)
        }
      })
      childIdsWithLocations = filterResult
    }

    return childIdsWithLocations;
  },

  deleteZoneInChild: async (childId,zoneID, t) => {
    const { ZonesInChild } = await connectToDatabase();
    let deletedZone = await ZonesInChild.destroy(
      { where: { child_id: childId, zone_id: zoneID }, raw: true },
      { transaction: t }
    );

    return deletedZone;
  },
};

