const connectToDatabase = require('../models/index');
const Sequelize = require('sequelize');
const _ = require('lodash');

module.exports = {
  /* Create new child */
  createChild: async (childObj, t) => {
    let createObj = {
      ...childObj,
      status: childObj?.enable_date !== null ? 'Disabled' : 'Enabled',
      scheduled_enable_date: childObj?.enable_date
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
    const { Child } = await connectToDatabase();
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

    if (schedluedEndDate != null && schedluedEndDate != '') {
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
        scheduled_end_date: null
      };

      updateChildDetails = await Child.update(
        update,
        {
          where: { child_id: childId },
          raw: true
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
  enableChild: async (childId, rooms, t) => {
    const { Child, RoomsInChild } = await connectToDatabase();
    let update = {
      status: 'Enabled',
      rooms: rooms,
      scheduled_end_date: null,
      scheduled_enable_date: null
    };

    let updateRoomStatus = await RoomsInChild.update(
      { disabled: 'false' },
      { where: { child_id: childId } },
      { transaction: t }
    );

    let updateChildDetails = await Child.update(
      update,
      {
        where: { child_id: childId },
        raw: true
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
  getChildrenWithSEA: async (userId, t) => {
    const { Child, Family } = await connectToDatabase();
    let familyMembers = await Family.findAll(
      {
        attributes: ['family_id'],
        where: {
          member_type: 'primary',
          user_id: userId
        },
        raw: true
      },
      { transaction: t }
    );

    familyMembers = familyMembers?.map((member) => member.family_id);

    let children = await Child.findAll(
      {
        where: {
          scheduled_end_date: {
            [Sequelize.Op.ne]: null
          },
          family_id: familyMembers
        },
        raw: true
      },
      { transaction: t }
    );

    return children;
  },

  assignRoomsToChild: async (childId, rooms, t) => {
    const { RoomsInChild } = await connectToDatabase();
    const roomsToadd = rooms.map((room) => {
      return {
        room_id: room.room_id,
        child_id: childId
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
        include: [{ model: Room, as: 'rooms', attributes: ['room_id', 'location', 'room_name'] }]
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
    console.log(update);
    let schedule = await RoomsInChild.update(
      { schedule: update },
      {
        where: { room_child_id: roomChildId }
      },
      { transaction: t }
    );

    return schedule;
  }
};
