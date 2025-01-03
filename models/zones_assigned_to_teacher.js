const { Sequelize } = require('sequelize');
const sequelize = require('../lib/database');

const ZonesInTeacher = sequelize.define(
  'zones_assigned_to_teacher',
  {
    zone_teacher_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    teacher_id: {
      type: Sequelize.STRING(100),
      allowNull: false
    },
    zone_id: {
      type: Sequelize.STRING(100),
      allowNull: false
    },
    createdAt: { type: Sequelize.DATE, field: 'created_at' },
    updatedAt: { type: Sequelize.DATE, field: 'updated_at' }
  },
  {
    tableName: 'zones_assigned_to_teacher',
    timestamps: true
  }
);

module.exports = ZonesInTeacher;
