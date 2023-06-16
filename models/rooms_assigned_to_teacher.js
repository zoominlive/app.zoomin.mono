const { Sequelize } = require('sequelize');
const sequelize = require('../lib/database');

const RoomsInTeacher = sequelize.define(
  'rooms_assigned_to_teacher',
  {
    room_teacher_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    teacher_id: {
      type: Sequelize.STRING(100),
      allowNull: false
    },
    room_id: {
      type: Sequelize.STRING(100),
      allowNull: false
    },
    createdAt: { type: Sequelize.DATE, field: 'created_at' },
    updatedAt: { type: Sequelize.DATE, field: 'updated_at' }
  },
  {
    tableName: 'rooms_assigned_to_teacher',
    timestamps: true
  }
);

module.exports = RoomsInTeacher;
