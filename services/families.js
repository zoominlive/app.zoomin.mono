const { Family, Camera, Room, Child } = require('../models/index');
const Sequelize = require('sequelize');
const childServices = require('./children');
const _ = require('lodash');
const sequelize = require('../lib/database');

const getSecondaryParents = async (familyIdArray) => {
  let ids = '';
  let mainQuery;
  if (!_.isEmpty(familyIdArray)) {
    familyIdArray.forEach((id) => (ids = ids + `family_id LIKE '%${id}%' OR `));
    ids = ids.slice(0, -3);
    mainQuery = `SELECT * FROM family  WHERE (${ids}) AND member_type="secondary" `;
    let secondaryParents = await sequelize.query(
      mainQuery,
      { type: Sequelize.QueryTypes.SELECT },
      {
        model: Family,
        mapToModel: true
      }
    );
    return secondaryParents;
  } else {
    return null;
  }
};
const getChildren = async (familyIdArray) => {
  let ids = '';
  let mainQuery;
  if (!_.isEmpty(familyIdArray)) {
    familyIdArray.forEach((id) => (ids = ids + `family_id LIKE '%${id}%' OR `));
    ids = ids.slice(0, -3);
    mainQuery = `SELECT * FROM child  WHERE (${ids}) `;
    let children = await sequelize.query(
      mainQuery,
      { type: Sequelize.QueryTypes.SELECT },
      {
        model: Child,
        mapToModel: true
      }
    );
    return children;
  } else {
    return null;
  }
};
const getPrimaryMember = async (familyId) => {
  let familyMember = await Family.findOne({
    where: { family_id: familyId, member_type: 'primary' },
    raw: true
  });
  return familyMember;
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

  /* Edit family details */
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

  /* Delete Existing family */
  deleteFamily: async (familyId) => {
    let deletedParents = await Family.destroy({
      where: { family_id: familyId },
      raw: true
    });

    let deletedChildren = await Child.destroy({
      where: { family_id: familyId },
      raw: true
    });

    return deletedParents, deletedChildren;
  },

  /* Fetch all the family's details */
  getAllFamilyDetails: async (userId, filter) => {
    let { pageNumber = 0, pageSize = 10, location = 'All', searchBy = '', roomsList = [] } = filter;

    let families;
    let count;
    let countQuery;
    let mainQuery;

    if (location === 'All') {
      location = '';
    }
    let query1;
    if (roomsList.length === 0) {
      query1 = `SELECT family.* FROM family INNER JOIN child WHERE family.user_id = ${userId} AND child.location LIKE '%${location}%' AND (family.first_name LIKE '%${searchBy}%' OR family.last_name LIKE '%${searchBy}%' OR child.first_name LIKE '%${searchBy}%')`;
    } else {
      let roomsToSearch = '';

      roomsList.forEach(
        (room) =>
          (roomsToSearch = roomsToSearch + `child.rooms LIKE '%${room.replace(/'/g, "\\'")}%' OR `)
      );
      roomsToSearch = roomsToSearch.slice(0, -3);

      query1 = `SELECT family.* FROM family INNER JOIN child WHERE family.user_id = ${userId} AND child.location LIKE '%${location}%' AND (family.first_name LIKE '%${searchBy}%' OR family.last_name LIKE '%${searchBy}%' OR child.first_name LIKE '%${searchBy}%') AND (${roomsToSearch})`;
    }
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

    const waitforResult = Promise.all(
      uniqueFamilies.map(async (familyMember) => {
        if (familyMember.member_type == 'secondary') {
          let isFound = 0;
          familyArray.map((family) => {
            if (family.primary.famiy_id === familyMember.family_id) {
              isFound = 1;
            }
          });

          if (isFound === 0) {
            let primaryMember = await getPrimaryMember(familyMember.family_id);
            familyArray.push({
              primary: primaryMember,
              secondary: [],
              children: []
            });
          }
        }
      })
    );

    const result = await waitforResult;

    familyArray = _.uniqWith(familyArray, _.isEqual);
    count = familyArray.length;
    familyArray = familyArray.slice(pageNumber * pageSize, (pageNumber + 1) * pageSize);

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

  disableFamily: async (familyMemberId, memberType, familyId, schedluedEndDate = null) => {
    let updateFamilyDetails;
    let updateChildDetails;

    if (schedluedEndDate != null && schedluedEndDate != '') {
      let update = {
        updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
        scheduled_end_date: schedluedEndDate
      };

      if (memberType == 'secondary') {
        updateFamilyDetails = await Family.update(update, {
          where: { family_member_id: familyMemberId },
          raw: true
        });
      } else if (memberType == 'primary') {
        updateFamilyDetails = await Family.update(update, {
          where: { family_id: familyId },
          raw: true
        });

        updateChildDetails = await Child.update(update, {
          where: { family_id: familyId },
          raw: true
        });
      }
    } else {
      let update = {
        updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
        status: 'Disabled'
      };

      if (memberType == 'secondary') {
        updateFamilyDetails = await Family.update(update, {
          where: { family_member_id: familyMemberId },
          raw: true
        });
      } else if (memberType == 'primary') {
        updateFamilyDetails = await Family.update(update, {
          where: { family_id: familyId },
          raw: true
        });

        updateChildDetails = await Child.update(update, {
          where: { family_id: familyId },
          raw: true
        });
      }
    }

    return updateFamilyDetails, updateChildDetails;
  },

  enableFamily: async (familyMemberId, memberType, familyId) => {
    let updateFamilyDetails;
    let updateChildDetails;

    let update = {
      updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
      status: 'Enabled'
    };

    if (memberType == 'secondary') {
      updateFamilyDetails = await Family.update(update, {
        where: { family_member_id: familyMemberId },
        raw: true
      });
    } else if (memberType == 'primary') {
      updateFamilyDetails = await Family.update(update, {
        where: { family_id: familyId },
        raw: true
      });

      updateChildDetails = await Child.update(update, {
        where: { family_id: familyId },
        raw: true
      });
    }

    return updateFamilyDetails, updateChildDetails;
  }
};
