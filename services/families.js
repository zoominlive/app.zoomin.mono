const { Family, Camera, Room, Child } = require('../models/index');
const Sequelize = require('sequelize');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const sequelize = require('../lib/database');
const encrypter = require('object-encrypter');
const engine = encrypter(process.env.JWT_SECRET_KEY, { ttl: true });

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
  /* Create new family */
  createFamily: async (familyObj) => {
    let familyCreated = await Family.create(familyObj);

    return familyCreated !== undefined ? familyCreated.toJSON() : null;
  },

  //generate new family Id
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
      secondaryParents?.forEach((secondary) => {
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

  //fetch family member details by ID
  getFamilyMemberById: async (familyMemberId) => {
    let familyMember = await Family.findOne({
      where: { family_member_id: familyMemberId },
      raw: true
    });
    return familyMember;
  },

  //disable family member by ID
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
        status: 'Disabled',
        scheduled_end_date: null
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

  // enable family member by ID
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
  },

  /* Create family token to reset password */
  createPasswordToken: async (familyMember) => {
    const token = engine.encrypt(
      { familyMemberId: familyMember.family_member_id, password: familyMember.password },
      900000
    );

    return token;
  },

  /* Get family member by email */
  getFamilyMember: async (email) => {
    let familyMember = await Family.findOne({
      where: { email: email }
    });
    return familyMember ? familyMember.toJSON() : null;
  },

  /* Create family member token */
  createFamilyMemberToken: async (familyMemberId) => {
    const token = jwt.sign({ family_member_id: familyMemberId }, process.env.JWT_SECRET_KEY, {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    });
    return { token };
  },

  /* Reset family member account password */
  resetPassword: async (familyMemberId, password) => {
    let setNewPassword = await Family.update(
      { password: password, is_verified: true },
      { returning: true, where: { family_member_id: familyMemberId } }
    );

    return setNewPassword;
  },
  /* Create family token to change email*/
  createEmailToken: async (user, newEmail) => {
    const token = engine.encrypt(
      { familyMemberId: user.family_member_id, email: newEmail },
      900000
    );

    return token;
  },

  /* Get family's with scheduled to end access  */
  getFamilyWithSEA: async (userId) => {
    let familyMembers = await Family.findAll({
      where: {
        scheduled_end_date: {
          [Sequelize.Op.ne]: null
        },
        member_type: 'primary',
        user_id: userId
      }
    });
    return familyMembers;
  }
};
