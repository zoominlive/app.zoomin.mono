const connectToDatabase = require('../models/index');
const Sequelize = require('sequelize');
const _ = require('lodash');
const RoomsInChild = require('../models/rooms_assigned_to_child');
const moment = require('moment');
module.exports = {
  /* Create new child */
  createChild: async (custID, childObj, t) => {
    let createObj = {
      ...childObj,
      status: childObj?.enable_date !== null ? 'Disabled' : 'Enabled',
      scheduled_enable_date: childObj?.enable_date,
      cust_id:custID
    };
    const { Child } = await connectToDatabase();
    let childCreated = await Child.create(createObj, { transaction: t });

    return childCreated !== undefined ? childCreated.toJSON() : null;
  },

  createChildren: async (childObj, t) => {
    let childObjs = childObj?.map((child) => {
      return {
        ...child,
        status: child?.enable_date !== null ? 'Disabled' : 'Enabled',
        scheduled_enable_date: child?.enable_date
      };
    });
    const { Child } = await connectToDatabase();
    let childCreated = await Child.bulkCreate(childObjs, { returning: true }, { transaction: t });

    await Promise.all(
      childObjs.map(async (child, index) => {
        let roomsInChild = child.rooms.rooms.map((room) => {
          return {  child_id: childCreated[index].child_id, room_id: room.room_id,
                    disabled: child?.enable_date !== null ? 'true' : 'false',
                    scheduled_enable_date: child?.enable_date !== null ? child?.enable_date : null};
        });
        await RoomsInChild.bulkCreate(roomsInChild, { returning: true }, { transaction: t });
      })
    );
    // const addRoomsToChild = await childServices.assignRoomsToChild(
    //   newChild?.child_id,
    //   params?.rooms?.rooms,
    //   t
    // );

    return childCreated;
  },

  /* Edit child details */
  editChild: async (params, t) => {
    const { Child } = await connectToDatabase();
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
    const { Child } = await connectToDatabase();
    childDetails = await Child.findOne(
      {
        raw: true,
        where: { child_id: childId }
      },
      { transaction: t }
    );

    return childDetails;
  },

  // delete selected child
  deleteChild: async (childId, t) => {
    const { Child, RoomsInChild } = await connectToDatabase();

    let roomsDeleted = await RoomsInChild.destroy(
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

    return deletedChild;
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

      let updateRooms = await RoomsInChild.update(
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
      let updateRooms = await RoomsInChild.update(
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
    const { Child, RoomsInChild } = await connectToDatabase();
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

    let enableRooms = await RoomsInChild.update(
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

  assignRoomsToChild: async (childId, rooms, t) => {
    const { RoomsInChild } = await connectToDatabase();
    const roomsToadd = rooms.map((room) => {
      return {
        room_id: room.room_id,
        child_id: childId,
        scheduled_enable_date: room.scheduled_enable_date
      };
    });

    let roomsAdded = await RoomsInChild.bulkCreate(roomsToadd, { transaction: t });

    return roomsAdded;
  },

  editAssignedRoomsToChild: async (childId, rooms, t) => {
    const { RoomsInChild } = await connectToDatabase();
    const roomsToadd = rooms.map((room) => {
      return {
        room_id: room.room_id,
        child_id: childId
      };
    });

    let roomsRemoved = await RoomsInChild.destroy(
      { where: { child_id: childId }, raw: true },
      { transaction: t }
    );

    let roomsAdded = await RoomsInChild.bulkCreate(roomsToadd, { transaction: t });

    return roomsAdded;
  },

  deleteAssignedRoomsToChild: async (childId, t) => {
    const { RoomsInChild } = await connectToDatabase();
    let roomsDeleted = await RoomsInChild.destroy(
      { where: { child_id: childId }, raw: true },
      { transaction: t }
    );

    return roomsDeleted;
  },

  disableSelectedRoomsForChild: async (childId, roomIds, t) => {
    const { RoomsInChild } = await connectToDatabase();
    let disabledRooms = await RoomsInChild.update(
      { disabled: true },
      {
        where: { child_id: childId, room_id: roomIds },
        raw: true
      },
      { transaction: t }
    );

    return disabledRooms;
  },

  addRoomsToChild: async (childId, t) => {
    const { RoomsInChild, Room } = await connectToDatabase();
    let disabledRooms = await RoomsInChild.findAll(
      {
        where: { child_id: childId },
        include: [{ model: Room, as: 'room', attributes: ['room_id', 'location', 'room_name'] }]
      },
      { transaction: t }
    );

    return disabledRooms;
  },

  addNewRoomsToChild: async (childId, roomsToAdd, selectedOption, scheduled_enable_date, t) => {
    const { RoomsInChild } = await connectToDatabase();
    let addRooms;
    if (selectedOption == 'enable') {
      const roomsToadd = roomsToAdd.map((room) => {
        return {
          room_id: room.room_id,
          child_id: childId,
          disabled: 'false'
        };
      });
      addRooms = await RoomsInChild.bulkCreate(roomsToadd, { transaction: t });
    } else {
      const roomsToadd = roomsToAdd.map((room) => {
        return {
          room_id: room.room_id,
          child_id: childId,
          disabled: 'true',
          scheduled_enable_date: scheduled_enable_date
        };
      });
      addRooms = await RoomsInChild.bulkCreate(roomsToadd, { transaction: t });
    }

    return addRooms;
  },

  changeRoomScheduler: async (roomChildId, update, t) => {
    const { RoomsInChild } = await connectToDatabase();

    let schedule = await RoomsInChild.update(
      { schedule: update },
      {
        where: { room_child_id: roomChildId }
      },
      { transaction: t }
    );

    return schedule;
  },

  disableSelectedLocations: async (childId, SED, locationsToDisable, t) => {
    const { RoomsInChild, Room } = await connectToDatabase();

    let getRoomsToDisable = await RoomsInChild.findAll(
      {
        where: {
          child_id: childId
        },
        attributes: ['room_child_id'],
        include: [
          {
            model: Room,
            as: 'room',
            where: {
              location: locationsToDisable
            },
            attributes: ['room_name']
          }
        ]
      },
      { transaction: t }
    );

    let roomChildIds = getRoomsToDisable?.map((room) => room.room_child_id);
    let disableRooms;

    if (SED != null && SED != '' && SED != false) {
      disableRooms = await RoomsInChild.update(
        { scheduled_disable_date: SED },
        {
          where: {
            room_child_id: roomChildIds
          }
        },
        { transaction: t }
      );
    } else {
      disableRooms = await RoomsInChild.update(
        { disabled: 'true' },
        {
          where: {
            room_child_id: roomChildIds
          }
        },
        { transaction: t }
      );
    }

    return disableRooms;
  },

  getChildOfAssignedRoomId: async (roomID, t) => {
    const { RoomsInChild } = await connectToDatabase();
    let roomChilds = await RoomsInChild.findAll(
      {
        raw: true,
        where: { room_id: roomID },
        attributes: ['child_id']

        },
      { transaction: t }
    );

    return roomChilds;
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
    const {Child} = await connectToDatabase();
    let AllChildren = await Child.findAll({
      where: {cust_id: custId},
      attributes: ["child_id", "location"], raw: true
    }, { transaction: t });
    
    if(!location.includes("Select All")){
      let filterResult = []
      AllChildren.map(i => {
          if(i.location?.locations?.every(it => location.includes(it))){
            filterResult.push(i)
          }
      })
      AllChildren = filterResult
    }

    return AllChildren;
  },

  deleteRoomInChild: async (childId,roomID, t) => {
    const { RoomsInChild } = await connectToDatabase();
    let deletedRoom = await RoomsInChild.destroy(
      { where: { child_id: childId, room_id: roomID }, raw: true },
      { transaction: t }
    );

    return deletedRoom;
  },
};

