const connectToDatabase = require('../models/index');
const Sequelize = require('sequelize');
const jwt = require('jsonwebtoken');
const _ = require('lodash-contrib');
const sequelize = require('../lib/database');
const encrypter = require('object-encrypter');
const engine = encrypter(process.env.JWT_SECRET_KEY, { ttl: true });
const { v4: uuidv4 } = require('uuid');

module.exports = {
  /* Create new family */
  createFamily: async (familyObj) => {
    const { Family } = await connectToDatabase();
    familyObj.family_member_id = uuidv4();
    let familyCreated = await Family.create(familyObj);

    return familyCreated !== undefined ? familyCreated.toJSON() : null;
  },

  /* Create new family */
  createFamilies: async (familyObj, t) => {
    const { Family } = await connectToDatabase();
    let familyCreated = await Family.bulkCreate(familyObj, { returning: true }, { transaction: t });

    return familyCreated;
  },

  //generate new family Id
  generateNewFamilyId: async () => {
    const { Family } = await connectToDatabase();
    let newFamilyId = await Family.findAll({
      order: [['family_id', 'DESC']],
      raw: true
    });

    newFamilyId = _.uniq(newFamilyId.map((family) => family.family_id));
    return newFamilyId[0] ? newFamilyId[0] + 1 : 1;
  },

  /* Edit family details */
  editFamily: async (params, t) => {
    const { Family } = await connectToDatabase();
    const familyObj = _.omit(params, ['family_member_id']);
    let update = {
      ...familyObj
    };

    let updateFamilyDetails = await Family.update(
      update,
      {
        where: { family_member_id: params.family_member_id }
      },
      { transaction: t }
    );

    if (updateFamilyDetails) {
      updateFamilyDetails = await Family.findOne(
        {
          where: { family_member_id: params.family_member_id }
        },
        { transaction: t }
      );
    }

    return updateFamilyDetails;
  },

  /* Delete Existing family */
  deleteFamily: async (familyId, t) => {
    const { Family, Child } = await connectToDatabase();
    let deletedParents = await Family.destroy(
      {
        where: { family_id: familyId },
        raw: true
      },
      { transaction: t }
    );

    let deletedChildren = await Child.destroy(
      {
        where: { family_id: familyId },
        raw: true
      },
      { transaction: t }
    );

    return deletedParents, deletedChildren;
  },

  /* Fetch all the family's details */
  getAllFamilyDetails: async (userId, filter, t) => {
    const { Family, Child } = await connectToDatabase();
    let { pageNumber = 1, pageSize = 10, location = 'All', searchBy = '', roomsList = [] } = filter;

    let families;
    let familyArray = [];
    families = await Family.findAll(
      {
        where: { user_id: userId },
        include: [
          {
            model: Child,
            where: {
              [Sequelize.Op.and]: {
                location: {
                  [Sequelize.Op.substring]: location === 'All' ? '' : location
                }
              }
            }
          }
        ]
      },
      { transaction: t }
    );

    families?.forEach((familyMember) => {
      if (familyMember.member_type == 'primary') {
        familyArray.push({
          primary: familyMember,
          secondary: [],
          children: []
        });
      }
    });

    families?.forEach((familyMember) => {
      if (familyMember.member_type == 'secondary') {
        familyArray.forEach((primaryMember, index) => {
          if (primaryMember.primary.family_id === familyMember.family_id) {
            familyArray[index].secondary.push(familyMember);
          }
        });
      }
    });

    familyArray.forEach((family, index) => {
      familyArray[index].children = family.primary.children;
    });

    let filteredArray = [];

    familyArray.forEach((family) => {
      let found = 0;
      const firstName = family.primary.first_name.toLowerCase();
      const lastName = family.primary.last_name.toLowerCase();

      if (firstName.includes(searchBy.toLowerCase()) || lastName.includes(searchBy.toLowerCase())) {
        found = 1;
      }
      family.secondary.forEach((family) => {
        const firstName = family.first_name.toLowerCase();
        const lastName = family.last_name.toLowerCase();

        if (
          firstName.includes(searchBy.toLowerCase()) ||
          lastName.includes(searchBy.toLowerCase())
        ) {
          found = 1;
        }
      });

      if (roomsList.length !== 0) {
        found = 0;
        family.children.forEach((child) => {
          const childRoom = JSON.stringify(child.rooms);
          roomsList.forEach((room) => {
            if (childRoom.includes(room)) {
              found = 1;
            }
          });
        });
      } else {
        family.children.forEach((child) => {
          const firstName = child.first_name.toLowerCase();
          const lastName = child.last_name.toLowerCase();
          if (
            firstName.includes(searchBy.toLowerCase()) ||
            lastName.includes(searchBy.toLowerCase())
          ) {
            found = 1;
          }
        });
      }

      if (found === 1) {
        filteredArray.push(family);
      }
    });
    let count = filteredArray.length;

    if (count > pageSize) {
      if (filteredArray.length > (pageNumber - 1) * pageSize + pageSize) {
        filteredArray = filteredArray.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
      } else if (filteredArray.length > (pageNumber - 1) * pageSize) {
        filteredArray = filteredArray.slice((pageNumber - 1) * pageSize);
      }
    }

    return { familyArray: filteredArray, count };
  },

  //fetch family member details by ID
  getFamilyMemberById: async (familyMemberId, t) => {
    const { Family } = await connectToDatabase();
    let familyMember = await Family.findOne(
      {
        where: { family_member_id: familyMemberId },
        raw: true
      },
      { transaction: t }
    );
    return familyMember;
  },

  //disable family member by ID
  disableFamily: async (
    familyMemberId,
    memberType,
    familyId,
    schedluedEndDate = null,
    locations_to_disable = [],
    user,
    t
  ) => {
    const { Family, Child } = await connectToDatabase();
    let updateFamilyDetails;
    let updateChildDetails;

    if (schedluedEndDate != null && schedluedEndDate != '') {
      let update = {
        scheduled_end_date: schedluedEndDate,
        disabled_locations: { locations: locations_to_disable }
      };

      if (memberType == 'secondary') {
        updateFamilyDetails = await Family.update(
          update,
          {
            where: { family_member_id: familyMemberId },
            raw: true
          },
          { transaction: t }
        );
      } else if (memberType == 'primary') {
        updateFamilyDetails = await Family.update(
          update,
          {
            where: { family_id: familyId },
            raw: true
          },
          { transaction: t }
        );

        updateChildDetails = await Child.update(
          update,
          {
            where: { family_id: familyId },
            raw: true
          },
          { transaction: t }
        );
      }
    } else {
      const location = await Family.findOne(
        {
          attributes: ['location'],
          where: {
            family_member_id: familyMemberId
          },
          raw: true
        },
        { transaction: t }
      );

      const locations = location?.location?.selected_locations?.filter((location) => {
        let count = 0;

        locations_to_disable.forEach((loc) => {
          if (loc === location) {
            count = 1;
          }
        });

        return count === 0;
      });

      let update = {
        disabled_locations: { locations: locations_to_disable },
        scheduled_end_date: null,
        status: 'Disabled',
        location: {
          selected_locations: locations,
          accessable_locations: locations
        }
      };

      if (memberType == 'secondary') {
        updateFamilyDetails = await Family.update(
          update,
          {
            where: { family_member_id: familyMemberId },
            raw: true
          },
          { transaction: t }
        );
      } else if (memberType == 'primary') {
        updateFamilyDetails = await Family.update(
          update,
          {
            where: { family_id: familyId },
            raw: true
          },
          { transaction: t }
        );

        updateChildDetails = await Child.update(
          update,
          {
            where: { family_id: familyId },
            raw: true
          },
          { transaction: t }
        );
      }
    }

    return updateFamilyDetails, updateChildDetails;
  },

  // enable family member by ID
  enableFamily: async (familyMemberId, memberType, familyId, user, t) => {
    const { Family, Child } = await connectToDatabase();
    let updateFamilyDetails;
    let updateChildDetails;

    const location = await Family.findOne(
      {
        attributes: ['location', 'disabled_locations'],
        where: {
          family_member_id: familyMemberId
        },
        raw: true
      },
      { transaction: t }
    );

    let locations = location?.location?.selected_locations;
    let disabledLocations = location?.disabled_locations?.locations;
    if (disabledLocations?.length !== 0) {
      locations.push(...disabledLocations);
    }

    let update = {
      status: 'Enabled',
      scheduled_end_date: null,
      location: {
        selected_locations: locations,
        accessable_locations: locations
      },
      disabled_locations: {}
    };

    if (memberType == 'secondary') {
      updateFamilyDetails = await Family.update(
        update,
        {
          where: { family_member_id: familyMemberId },
          raw: true
        },
        { transaction: t }
      );
    } else if (memberType == 'primary') {
      updateFamilyDetails = await Family.update(
        update,
        {
          where: { family_id: familyId },
          raw: true
        },
        { transaction: t }
      );

      updateChildDetails = await Child.update(
        update,
        {
          where: { family_id: familyId },
          raw: true
        },
        { transaction: t }
      );
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
  getFamilyMember: async (email, t) => {
    const { Family } = await connectToDatabase();
    let familyMember = await Family.findOne(
      {
        where: { email: email }
      },
      { transaction: t }
    );
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
  resetPassword: async (familyMemberId, password, t) => {
    const { Family } = await connectToDatabase();
    let setNewPassword = await Family.update(
      { password: password, is_verified: true },
      { returning: true, where: { family_member_id: familyMemberId } },
      { transaction: t }
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
  getFamilyWithSEA: async (userId, t) => {
    const { Family } = await connectToDatabase();
    let familyMembers = await Family.findAll(
      {
        where: {
          scheduled_end_date: {
            [Sequelize.Op.ne]: null
          },
          member_type: 'primary',
          user_id: userId
        }
      },
      { transaction: t }
    );
    return familyMembers;
  },
  getAllUsersForLocation: async (custId, locations) => {
    const { Family } = await connectToDatabase();
    let locArray = locations.map((loc) => {
      return {
        location: {
          [Sequelize.Op.substring]: loc
        }
      };
    });
    let users = await Family.findAll({
      where: { cust_id: custId, [Sequelize.Op.or]: locArray },
      attributes: ['first_name', 'last_name', 'family_member_id']
    });

    return users;
  }
};
