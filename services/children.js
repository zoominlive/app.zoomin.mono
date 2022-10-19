const { Child } = require('../models/index');
const Sequelize = require('sequelize');
const _ = require('lodash');
const sequelize = require('../lib/database');

module.exports = {
  /* Create new room */
  createChild: async (childObj) => {
    let childCreated = await Child.create(childObj);

    return childCreated !== undefined ? childCreated.toJSON() : null;
  },

  /* Edit room details */
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

  getAllchildren: async (familyId) => {
    childDetails = await Child.findAll({
      raw: true,
      where: { family_id: familyId }
    });

    return childDetails;
  }
};
