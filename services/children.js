const { Child, Family, RoomsInChild, Room } = require('../models/index');
const Sequelize = require('sequelize');
const _ = require('lodash');
const sequelize = require('../lib/database');

module.exports = {
  /* Create new child */
  createChild: async (childObj) => {
    let childCreated = await Child.create(childObj);

    return childCreated !== undefined ? childCreated.toJSON() : null;
  },

  createChildren: async (childObj) => {
    let childCreated = await Child.bulkCreate(childObj, { returning: true });

    return childCreated;
  },

  /* Edit child details */
  editChild: async (params) => {
    const childObj = _.omit(params, ['child_id']);
    let update = {
      updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
      ...childObj
    };

    let updateChildDetails = await Child.update(update, {
      where: { child_id: params.child_id }
    });

    if (updateChildDetails) {
      updateChildDetails = await Child.findOne({
        where: { child_id: params.child_id }
      });
    }

    return updateChildDetails.toJSON();
  },
  // get all children for given family Id
  getAllchildren: async (familyId) => {
    childDetails = await Child.findAll({
      raw: true,
      where: { family_id: familyId }
    });

    return childDetails;
  },

  // get all children for given family Id
  getChildById: async (childId) => {
    childDetails = await Child.findOne({
      raw: true,
      where: { child_id: childId }
    });

    return childDetails;
  },

  // delete selected child
  deleteChild: async (childId) => {
    let deletedChild = await Child.destroy({
      where: { child_id: childId },
      raw: true
    });

    return deletedChild;
  },

  //disable selected child
  disableChild: async (childId, schedluedEndDate = null) => {
    let updateChildDetails;

    if (schedluedEndDate != null && schedluedEndDate != '') {
      let update = {
        updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
        scheduled_end_date: schedluedEndDate
      };

      updateChildDetails = await Child.update(update, {
        where: { child_id: childId },
        raw: true
      });

      if (updateChildDetails) {
        updateChildDetails = await Child.findOne({
          where: { child_id: childId },
          raw: true
        });
      }
    } else {
      let update = {
        updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
        status: 'Disabled',
        scheduled_end_date: null
      };

      updateChildDetails = await Child.update(update, {
        where: { child_id: childId },
        raw: true
      });

      if (updateChildDetails) {
        updateChildDetails = await Child.findOne({
          where: { child_id: childId },
          raw: true
        });
      }
    }

    return updateChildDetails;
  },

  //enable selected child
  enableChild: async (childId, rooms) => {
    let update = {
      updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
      status: 'Enabled',
      rooms: rooms,
      scheduled_end_date: null
    };

    let updateRoomStatus = await RoomsInChild.update(
      { disabled: 'false' },
      { where: { child_id: childId } }
    );

    let updateChildDetails = await Child.update(update, {
      where: { child_id: childId },
      raw: true
    });

    if (updateChildDetails) {
      updateChildDetails = await Child.findOne({
        where: { child_id: childId },
        raw: true
      });
    }

    return updateChildDetails;
  },
  getChildrenWithSEA: async (userId) => {
    let familyMembers = await Family.findAll({
      attributes: ['family_id'],
      where: {
        member_type: 'primary',
        user_id: userId
      },
      raw: true
    });

    familyMembers = familyMembers?.map((member) => member.family_id);

    let children = await Child.findAll({
      where: {
        scheduled_end_date: {
          [Sequelize.Op.ne]: null
        },
        family_id: familyMembers
      },
      raw: true
    });

    return children;
  },

  assignRoomsToChild: async (childId, rooms) => {
    const roomsToadd = rooms.map((room) => {
      return {
        room_id: room.room_id,
        child_id: childId
      };
    });

    let roomsAdded = await RoomsInChild.bulkCreate(roomsToadd);

    return roomsAdded;
  },

  editAssignedRoomsToChild: async (childId, rooms) => {
    const roomsToadd = rooms.map((room) => {
      return {
        room_id: room.room_id,
        child_id: childId
      };
    });

    let roomsRemoved = await RoomsInChild.destroy({ where: { child_id: childId }, raw: true });

    let roomsAdded = await RoomsInChild.bulkCreate(roomsToadd);

    return roomsAdded;
  },

  deleteAssignedRoomsToChild: async (childId) => {
    let roomsDeleted = await RoomsInChild.destroy({ where: { child_id: childId }, raw: true });

    return roomsDeleted;
  },

  disableSelectedRoomsForChild: async (childId, roomIds) => {
    let disabledRooms = await RoomsInChild.update(
      { disabled: true },
      {
        where: { child_id: childId, room_id: roomIds },
        raw: true
      }
    );

    return disabledRooms;
  },

  addRoomsToChild: async (childId) => {
    let disabledRooms = await RoomsInChild.findAll({
      where: { child_id: childId },
      include: [{ model: Room, attributes: ['room_id', 'location', 'room_name'] }]
    });

    return disabledRooms;
  }
};
