const { Sequelize } = require('sequelize');
const sequelize = require('../lib/database');

const Child = sequelize.define(
  'child',
  {
    child_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    first_name: {
      type: Sequelize.STRING(30),
      required: [true, 'FirstName is mandatory field']
    },
    last_name: {
      type: Sequelize.STRING(30),
      required: [true, 'Last Name is mandatory field']
    },
    room: {
      type: Sequelize.STRING(30),
      allowNull: false,
      required: true
    },
    family_id: {
      type: Sequelize.INTEGER,
      comment: 'key used to assosiate child to family member'
    },
    created_at: {
      type: 'TIMESTAMP',
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      allowNull: false
    },
    updated_at: {
      type: 'TIMESTAMP',
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      allowNull: false
    }
  },
  {
    tableName: 'child',
    timestamps: false
  }
);

module.exports = Child;
