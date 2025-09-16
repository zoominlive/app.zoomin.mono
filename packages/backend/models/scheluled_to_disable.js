const { Sequelize } = require('sequelize');
const { sequelize } = require('../lib/database');

const ScheduledToDisable = sequelize.define(
  'scheduled_to_disable',
  {
    disable_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    loc_name: {
      type: Sequelize.STRING(50),
      allowNull: false
    },
    child_id: {
      type: Sequelize.INTEGER
    },
    family_member_id: {
      type: Sequelize.STRING(50)
    },
    family_id: {
      type: Sequelize.INTEGER
    },
    user_id: {
      type: Sequelize.STRING(50)
    },
    scheduled_end_date: {
      type: Sequelize.DATEONLY,
      allowNull: false
    },
    createdAt: { type: Sequelize.DATE, field: 'created_at' },
    updatedAt: { type: Sequelize.DATE, field: 'updated_at' }
  },
  {
    tableName: 'scheduled_to_disable',
    timestamps: true
  }
);

module.exports = ScheduledToDisable;
