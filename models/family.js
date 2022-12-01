const { Sequelize } = require('sequelize');
const sequelize = require('../lib/database');

const Family = sequelize.define(
  'family',
  {
    family_member_id: {
      type: Sequelize.STRING(50),
      allowNull: false,
      primaryKey: true
    },
    family_id: {
      type: Sequelize.INTEGER,
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
    member_type: {
      type: Sequelize.ENUM('primary', 'secondary'),
      required: true
    },
    phone: {
      type: Sequelize.STRING(20)
    },
    email: {
      type: Sequelize.STRING(50),
      unique: {
        args: true,
        msg: 'Email address already in use!'
      },
      required: [true, 'Email is mandatory field']
    },
    password: {
      type: Sequelize.STRING(200)
    },
    password_link: {
      type: Sequelize.ENUM('active', 'inactive'),
      defaultValue: 'active'
    },
    is_verified: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      required: false
    },
    location: {
      type: Sequelize.JSON,
      defaultValue: null
    },
    role: {
      type: Sequelize.ENUM('Family'),
      defaultValue: 'Family',
      required: true
    },
    profile_image: {
      type: Sequelize.STRING(100),
      required: false,
      default: ''
    },
    status: {
      type: Sequelize.ENUM('Enabled', 'Disabled'),
      defaultValue: 'Enabled',
      required: true
    },
    scheduled_end_date: {
      type: Sequelize.DATEONLY,
      allowNull: true,
      defaultValue: null
    },
    time_zone: {
      type: Sequelize.STRING(100)
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
