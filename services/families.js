const { Family, Camera, Room, Child } = require('../models/index');
const Sequelize = require('sequelize');
const childServices = require('./children');
const _ = require('lodash');
const sequelize = require('../lib/database');

const getSecondaryParents = async (familyIdArray) => {
  let ids = '';
  familyIdArray.forEach((id) => (ids = ids + `family_id LIKE '%${id}%' OR `));
  ids = ids.slice(0, -3);

  let mainQuery = `SELECT DISTINCT * FROM family  WHERE (${ids}) AND member_type="secondary" `;

  let secondaryParents = await sequelize.query(
    mainQuery,
    { type: Sequelize.QueryTypes.SELECT },
    {
      model: Family,
      mapToModel: true
    }
  );
  return secondaryParents;
};
const getChildren = async (familyIdArray) => {
  let ids = '';
  familyIdArray.forEach((familyId) => (ids = ids + `family_id LIKE '%${familyId}%' OR `));
  ids = ids.slice(0, -3);

  let mainQuery = `SELECT DISTINCT * FROM child  WHERE (${ids})`;

  let children = await sequelize.query(
    mainQuery,
    { type: Sequelize.QueryTypes.SELECT },
    {
      model: Child,
      mapToModel: true
    }
  );
  return children;
};

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

  // /* Delete Existing room */
  // deleteRoom: async (roomId) => {
  //   let deletedRoom = await Room.destroy({
  //     where: { room_id: roomId }
  //   });

  //   return deletedRoom;
  // },

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

      let query1 = `SELECT family.* FROM family INNER JOIN child WHERE family.user_id = ${userId} AND child.location LIKE '%${location}%' AND (family.first_name LIKE '%${searchBy}%' OR family.last_name LIKE '%${searchBy}%' OR child.first_name LIKE '%${searchBy}%') AND (${roomsToSearch})`;

      families = await sequelize.query(
        query1,
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
    }

    // const finalFamilyDetails = await filterFamilies;
    let uniqueFamilies = _.uniqWith(families, _.isEqual);
    let familyArray = [];

    uniqueFamilies.forEach((familyMember) => {
      if (familyMember.member_type == 'primary') {
        familyArray.push({
          primary: familyMember,
          secondary: [],
          children: []
        });
      }
    });

    uniqueFamilies.forEach(async (familyMember) => {
      if (familyMember.member_type == 'secondary') {
        let isFound = 0;
        familyArray.forEach((family) => {
          if (family.primary.famiy_id === familyMember.family_id) {
            isFound = 1;
          }
        });

        if ((isFound = 0)) {
          let primaryMember = await getPrimaryMember(familyMember.family_id);
          familyArray.push({
            primary: primaryMember,
            secondary: [],
            children: []
          });
        }
      }
    });

    let familyIdToSearch = familyArray.map((family) => family.primary.family_id);

    let secondaryParents = await getSecondaryParents(familyIdToSearch);

    let children = await getChildren(familyIdToSearch);

    familyArray.forEach((family, index) => {
      secondaryParents.forEach((secondary) => {
        if (secondary.family_id === family.primary.family_id) {
          familyArray[index].secondary.push(secondary);
        }
      });
      children.forEach((child) => {
        if (child.family_id === family.primary.family_id) {
          familyArray[index].children.push(child);
        }
      });
    });

    return { familyArray, count };
  },

  getFamilyMember: async (familyMemberId) => {
    let familyMember = await Family.findOne({
      where: { family_member_id: familyMemberId },
      raw: true
    });
    return familyMember;
  },

  getPrimaryMember: async (familyId) => {
    let familyMember = await Family.findOne({
      where: { family_id: familyId, member_type: 'primary' },
      raw: true
    });
    return familyMember;
  }
};
