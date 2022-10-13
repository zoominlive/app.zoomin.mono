const { Sequelize } = require('sequelize');
const sequelize = require('../lib/database');

const Family = sequelize.define(
  'family',
  {
    family_id: {
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
    relationship: {
      type: Sequelize.ENUM(
        'Mother',
        'Father',
        'Aunt',
        'Uncle',
        'Grandmother',
        'Grandfather',
        'Other'
      ),
      required: true
    },
    phone: {
      type: Sequelize.STRING(20)
    },
    email: {
      type: Sequelize.STRING(50),
      unique: true,
      required: [true, 'Email is mandatory field']
    },
    location: {
      type: Sequelize.JSON,
      defaultValue: null
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
    tableName: 'family',
    timestamps: false
  }
);

module.exports = Family;
