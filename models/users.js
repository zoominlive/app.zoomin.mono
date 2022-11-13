const { Sequelize } = require('sequelize');
const sequelize = require('../lib/database');

const Users = sequelize.define(
  'users',
  {
    user_id: {
      type: Sequelize.STRING(50),
      allowNull: false,
      primaryKey: true
    },
    first_name: {
      type: Sequelize.STRING(30),
      required: [true, 'FirstName is mandatory field']
    },
    last_name: {
      type: Sequelize.STRING(30),
      required: [true, 'Last Name is mandatory field']
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
    location: {
      type: Sequelize.JSON,
      allowNull: false,
      required: [true, 'Atleast one location is required']
    },
    is_verified: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      required: false
    },
    status: {
      type: Sequelize.ENUM('active', 'inactive'),
      defaultValue: 'active',
      required: true
    },
    role: {
      type: Sequelize.ENUM('User', 'Admin'),
      required: true
    },
    profile_image: {
      type: Sequelize.STRING(100),
      required: false,
      default: ''
    },
    cust_id: {
      type: Sequelize.STRING(50),
      allowNull: false
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
    tableName: 'users',
    timestamps: false
  }
);

module.exports = Users;
