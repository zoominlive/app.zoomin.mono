const { Family, Camera, Room, Child } = require('../models/index');
const Sequelize = require('sequelize');
const childServices = require('./children');
const _ = require('lodash');
const sequelize = require('../lib/database');

module.exports = {
  /* Create new room */
  createFamily: async (familyObj) => {
    let familyCreated = await Family.create(familyObj);

    return familyCreated !== undefined ? familyCreated.toJSON() : null;
  },

  generateNewFamilyId: async (userId) => {
    let newFamilyId = await Family.findOne({
      where: { user_id: userId },
      order: [['family_id', 'DESC']]
    });

    if (newFamilyId === null) {
      return 1;
    } else {
      return newFamilyId.family_id + 1;
    }
  },

  /* Edit room details */
  editFamily: async (params) => {
    const familyObj = _.omit(params, ['family_member_id']);
    let update = {
      updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
      ...familyObj
    };

    let updateFamilyDetails = await Family.update(update, {
      where: { family_member_id: params.family_member_id }
    });

    if (updateFamilyDetails) {
      updateFamilyDetails = await Family.findOne({
        where: { family_member_id: params.family_member_id }
      });
    }

    return updateFamilyDetails;
  },

  /* Delete Existing room */
  deleteRoom: async (roomId) => {
    let deletedRoom = await Room.destroy({
      where: { room_id: roomId }
    });

    return deletedRoom;
  },

  /* Fetch all the user's details */
  getAllFamilyDetails: async (userId, filter) => {
    let { pageNumber = 0, pageSize = 10, location = 'All', searchBy = '', roomsList = [] } = filter;

    let families;
    let count;
    let countQuery;
    let mainQuery;

    if (location === 'All') {
      location = '';
    }

    // if (families.length === 0) {

    if (roomsList.length === 0) {
      countQuery = `SELECT COUNT(DISTINCT family.family_id) AS count FROM family INNER JOIN child WHERE family.user_id = ${userId} AND family.location LIKE '%${location}%' AND (family.first_name LIKE '%${searchBy}%' OR family.last_name LIKE '%${searchBy}%' OR child.first_name LIKE '%${searchBy}%')`;
      mainQuery = `SELECT DISTINCT family.* FROM family INNER JOIN child WHERE family.user_id = ${userId} AND family.location LIKE '%${location}%' AND (family.first_name LIKE '%${searchBy}%' OR family.last_name LIKE '%${searchBy}%' OR child.first_name LIKE '%${searchBy}%') LIMIT ${pageSize} OFFSET ${
        pageNumber * pageSize
      }`;
    } else {
      let roomsToSearch = '';
      roomsList.forEach(
        (room) =>
          (roomsToSearch = roomsToSearch + `child.rooms LIKE '%${room.replace(/'/g, "\\'")}%' OR `)
      );
      roomsToSearch = roomsToSearch.slice(0, -3);
      countQuery = `SELECT DISTINCT COUNT(family.family_id) AS count FROM family INNER JOIN child WHERE family.user_id = ${userId} AND family.location LIKE '%${location}%' AND (family.first_name LIKE '%${searchBy}%' OR family.last_name LIKE '%${searchBy}%' OR child.first_name LIKE '%${searchBy}%') AND (${roomsToSearch})`;
      mainQuery = `SELECT family.* FROM family INNER JOIN child WHERE family.user_id = ${userId} AND family.location LIKE '%${location}%' AND (family.first_name LIKE '%${searchBy}%' OR family.last_name LIKE '%${searchBy}%' OR child.first_name LIKE '%${searchBy}%') AND (${roomsToSearch}) LIMIT ${pageSize} OFFSET ${
        pageNumber * pageSize
      }`;
    }

    count = (
      await sequelize.query(
        countQuery,
        {
          model: Family,
          mapToModel: true
        },
        {
          model: Child,
          mapToModel: true
        },
        { type: Sequelize.QueryTypes.SELECT }
      )
    )[0].dataValues.count;

    families = await sequelize.query(
      mainQuery,
      { type: Sequelize.QueryTypes.SELECT },
      {
        model: Family,
        mapToModel: true
      },
      {
        model: Child,
        mapToModel: true
      }
    );

    let filterFamilies = Promise.all(
      families.map(async (family) => {
        let familyDetails = family;
        let familyId;
        if (family.dataValues) {
          familyId = family.dataValues.family_id;
        } else {
          familyId = family.family_id;
        }

        if (family.dataValues) {
          familyDetails = family.dataValues;
        }

        let childDetails = await childServices.getAllchildren(familyId);
        if (_.isEmpty(childDetails)) {
          childDetails = [];
        }
        return { ...familyDetails, childDetails };
      })
    );

    const finalFamilyDetails = await filterFamilies;

    let familyArray = [];

    finalFamilyDetails.forEach((familyMember) => {
      if (familyMember.member_type == 'primary') {
        familyArray.push({
          primary: _.omit(familyMember, ['childDetails']),
          secondary: [],
          children: familyMember.childDetails
        });
      }
    });

    finalFamilyDetails.forEach((familyMember) => {
      if (familyMember.member_type == 'secondary') {
        familyArray.forEach((family, index) => {
          if (familyMember.family_id === family.primary.family_id) {
            familyArray[index].secondary.push(_.omit(familyMember, ['childDetails']));
          }
        });
      }
    });

    return { familyArray, count };
  },

  getFamilyMember: async (familyMemberId) => {
    let familyMember = await Family.findOne({
      where: { family_member_id: familyMemberId },
      raw: true
    });
    return familyMember;
  }
};
