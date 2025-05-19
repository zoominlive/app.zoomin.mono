const { Sequelize } = require('sequelize');
const { sequelize } = require('../lib/database');

const Zone = sequelize.define(
  'zone',
  {
    zone_id: {
      type: Sequelize.STRING(50),
      allowNull: false,
      primaryKey: true
    },
    zone_name: {
      type: Sequelize.STRING(50),
      allowNull: false
    },
    user_id: {
      type: Sequelize.STRING(50),
      allowNull: false
    },
    cust_id: {
      type: Sequelize.STRING(50),
      allowNull: false
    },
    loc_id: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    zone_type_id: {
      type: Sequelize.STRING(50),
      allowNull: true
    },
    // location: {
    //   type: Sequelize.STRING(50),
    //   allowNull: false
    // },
    stream_live_license: {
      type: Sequelize.BOOLEAN(),
      defaultValue: false,
     },
    createdAt: { type: Sequelize.DATE, field: 'created_at' },
    updatedAt: { type: Sequelize.DATE, field: 'updated_at' },
    deletedAt: { type: Sequelize.DATE, field: 'deleted_at' }
  },
  {
    tableName: 'zone',
    timestamps: true,
    paranoid: true
  }
);

module.exports = Zone;
